import "dotenv/config";
import fs from "fs";
import path from "path";
import type { ModelName, ClientLLM } from "@browserbasehq/stagehand";
import { createDeepSeekClient } from "./deepseek-client";

export type StagehandModelOption =
  | { type: "provider"; modelName: ModelName; apiKey: string }
  | { type: "client"; client: ClientLLM };

export interface AppConfig {
  modelOption: StagehandModelOption;
  headless: boolean;
  userDataDir?: string;
  browserbaseApiKey?: string;
  summary: {
    provider: string;
    model: string;
  };
}

export function getConfig(): AppConfig {
  const modelNameInput = (process.env.MODEL_NAME || "").trim();
  const headless = process.env.HEADLESS === "true";
  const rawUserDataDir = (process.env.USER_DATA_DIR || "").trim();
  let userDataDir: string | undefined = undefined;
  if (rawUserDataDir && rawUserDataDir !== "false" && rawUserDataDir !== "none") {
    userDataDir = path.resolve(process.cwd(), rawUserDataDir);
    if (!fs.existsSync(userDataDir)) {
      try {
        fs.mkdirSync(userDataDir, { recursive: true });
      } catch (e) {
        // Fallback to undefined if creation fails
        userDataDir = undefined;
      }
    }
  }
  const browserbaseApiKey = process.env.BROWSERBASE_API_KEY || undefined;

  // Check specific API keys available
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const googleKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN;
  const genericKey = process.env.MODEL_API_KEY;

  // Case 1: Direct DeepSeek or Custom OpenAI-compatible endpoint (auto, deepseek-flash, etc.)
  if (
    modelNameInput.startsWith("deepseek/") ||
    modelNameInput.toLowerCase() === "deepseek" ||
    modelNameInput.toLowerCase() === "deepseek-flash" ||
    modelNameInput.toLowerCase() === "auto" ||
    modelNameInput === "" ||
    (deepseekKey && !modelNameInput) ||
    Boolean(process.env.DEEPSEEK_BASE_URL || process.env.AI_EXTRACTOR_BASE_URL)
  ) {
    const key = deepseekKey || genericKey || process.env.AI_EXTRACTOR_API_KEY || openaiKey || "sk-placeholder";
    const model =
      modelNameInput && modelNameInput !== "auto"
        ? modelNameInput.replace(/^deepseek\//, "")
        : process.env.AI_EXTRACTOR_MODEL && process.env.AI_EXTRACTOR_MODEL !== "auto"
        ? process.env.AI_EXTRACTOR_MODEL
        : "deepseek-chat";
    const baseURL =
      process.env.DEEPSEEK_BASE_URL ||
      process.env.AI_EXTRACTOR_BASE_URL ||
      process.env.OPENAI_BASE_URL ||
      "https://api.hcnsec.cn/v1";

    const client = createDeepSeekClient({
      apiKey: key,
      model,
      baseURL,
    });

    return {
      modelOption: { type: "client", client },
      headless,
      userDataDir,
      browserbaseApiKey,
      summary: {
        provider: "OpenAI-Compatible (Custom Client)",
        model,
      },
    };
  }

  // Case 2: Groq DeepSeek Flash model (e.g. groq/deepseek-r1-distill-llama-70b)
  if (
    modelNameInput.startsWith("groq/deepseek") ||
    modelNameInput.includes("deepseek") ||
    (groqKey && !modelNameInput)
  ) {
    const resolvedModel: ModelName = (modelNameInput.startsWith("groq/")
      ? modelNameInput
      : "groq/deepseek-r1-distill-llama-70b") as ModelName;
    const apiKey = groqKey || genericKey || "";

    return {
      modelOption: {
        type: "provider",
        modelName: resolvedModel,
        apiKey,
      },
      headless,
      userDataDir,
      browserbaseApiKey,
      summary: {
        provider: "Groq (DeepSeek)",
        model: resolvedModel,
      },
    };
  }

  // Case 3: Google Gemini Flash (e.g. google/gemini-2.5-flash)
  if (
    modelNameInput.includes("flash") ||
    modelNameInput.startsWith("google/") ||
    (googleKey && !modelNameInput)
  ) {
    const resolvedModel: ModelName = (modelNameInput.startsWith("google/")
      ? modelNameInput
      : "google/gemini-2.5-flash") as ModelName;
    const apiKey = googleKey || genericKey || "";

    return {
      modelOption: {
        type: "provider",
        modelName: resolvedModel,
        apiKey,
      },
      headless,
      userDataDir,
      browserbaseApiKey,
      summary: {
        provider: "Google (Flash)",
        model: resolvedModel,
      },
    };
  }

  // Case 4: Default or standard models (OpenAI, Anthropic, etc.)
  const resolvedModel: ModelName = (modelNameInput || "openai/gpt-4o-mini") as ModelName;
  let apiKey = genericKey || "";

  if (!apiKey) {
    if (resolvedModel.startsWith("openai/")) {
      apiKey = openaiKey || "";
    } else if (resolvedModel.startsWith("anthropic/")) {
      apiKey = anthropicKey || "";
    } else if (resolvedModel.startsWith("groq/")) {
      apiKey = groqKey || "";
    } else if (resolvedModel.startsWith("google/")) {
      apiKey = googleKey || "";
    }
  }

  return {
    modelOption: {
      type: "provider",
      modelName: resolvedModel,
      apiKey,
    },
    headless,
    userDataDir,
    browserbaseApiKey,
    summary: {
      provider: resolvedModel.split("/")[0] || "Custom",
      model: resolvedModel,
    },
  };
}
