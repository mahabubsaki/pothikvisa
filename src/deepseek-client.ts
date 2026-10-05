import type { ClientLLM } from "@browserbasehq/stagehand";

export interface DeepSeekClientOptions {
  apiKey: string;
  model?: string;
  baseURL?: string;
}

/**
 * Creates a Stagehand ClientLLM instance for DeepSeek (e.g. deepseek-chat / deepseek-reasoner).
 * Uses DeepSeek's OpenAI-compatible API endpoint (https://api.deepseek.com/chat/completions).
 */
export function createDeepSeekClient(options: DeepSeekClientOptions): ClientLLM {
  const {
    apiKey,
    model = "deepseek-chat",
    baseURL = "https://api.deepseek.com",
  } = options;

  return {
    generate: async (params: Parameters<ClientLLM["generate"]>[0]) => {
      const messages: Array<{ role: string; content: string }> = [];

      // Include system prompt if provided
      if (params.systemPrompt) {
        messages.push({
          role: "system",
          content: params.systemPrompt,
        });
      }

      // Convert Stagehand structured messages into OpenAI/DeepSeek chat messages
      for (const msg of params.messages || []) {
        let contentStr = "";
        if (typeof msg.content === "string") {
          contentStr = msg.content;
        } else if (Array.isArray(msg.content)) {
          contentStr = (msg.content as unknown[])
            .map((b: unknown) => {
              if (b && typeof b === "object") {
                const bObj = b as Record<string, unknown>;
                if (bObj.type === "text" && typeof bObj.text === "string") return bObj.text;
                if (bObj.type === "tool_result") {
                  return typeof bObj.content === "string" ? bObj.content : JSON.stringify(bObj.content);
                }
              }
              return JSON.stringify(b);
            })
            .join("\n");
        } else if (msg.content && typeof msg.content === "object") {
          const textVal = (msg.content as Record<string, unknown>).text;
          contentStr = typeof textVal === "string" ? textVal : JSON.stringify(msg.content);
        }

        messages.push({
          role: msg.role,
          content: contentStr,
        });
      }

      const isStructured = params.responseFormat?.type === "json_schema";
      const requestPayload: Record<string, unknown> = {
        model,
        messages,
        temperature: params.temperature ?? 0.2,
      };

      if (params.responseFormat && params.responseFormat.type === "json_schema") {
        // DeepSeek supports response_format: { type: "json_object" }
        requestPayload.response_format = { type: "json_object" };
        // Ensure prompt requests valid JSON format matching schema
        if (params.responseFormat.schema) {
          messages.push({
            role: "system",
            content: `IMPORTANT: Your response must be a single valid JSON object strictly complying with this JSON Schema:\n${JSON.stringify(params.responseFormat.schema)}`,
          });
        }
      }

      const response = await fetch(`${baseURL.replace(/\/+$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`DeepSeek API error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const rawText = choice?.message?.content || "";

      const usage = {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      };

      if (isStructured) {
        let structuredContent: Record<string, unknown> = {};
        try {
          // Parse JSON, stripping markdown fences if present
          const cleanedText = rawText.replace(/```json\n?|\n?```/g, "").trim();
          structuredContent = JSON.parse(cleanedText) as Record<string, unknown>;
        } catch {
          structuredContent = { text: rawText };
        }

        type StructuredReturn = Extract<Awaited<ReturnType<ClientLLM["generate"]>>, { outputFormat: "json_schema" }>;
        return {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: rawText }],
          outputFormat: "json_schema" as const,
          structuredContent: structuredContent as unknown as StructuredReturn["structuredContent"],
          stopReason: (choice?.finish_reason as string) || "stop",
          usage,
        };
      }

      return {
        role: "assistant" as const,
        content: [{ type: "text" as const, text: rawText }],
        outputFormat: "text" as const,
        stopReason: choice?.finish_reason || "stop",
        usage,
      };
    },
  };
}

/**
 * Creates a minimal fallback ClientLLM for Stagehand initialization when AI is not required.
 */
export function createFallbackClient(): ClientLLM {
  return {
    generate: async () => ({
      role: "assistant" as const,
      content: [{ type: "text" as const, text: "" }],
      outputFormat: "text" as const,
      stopReason: "stop",
    }),
  };
}

