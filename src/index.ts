import { initStagehand } from "./stagehand";
import { getConfig } from "./config";
import { createDeepSeekClient } from "./deepseek-client";

export { initStagehand, getConfig, createDeepSeekClient };

async function main() {
  console.log("=================================================");
  console.log("🚀 Stagehand Browser Automation Suite");
  console.log("=================================================");

  const config = getConfig();
  console.log(`Active Model:    ${config.summary.model} (${config.summary.provider})`);
  console.log(`Headless Mode:   ${config.headless}`);
  console.log(`User Data Dir:   ${config.userDataDir}`);
  console.log("-------------------------------------------------");
  console.log("Available Commands:");
  console.log("  • pnpm run example:quickstart  - Run a quick observe/extract test");
  console.log("  • pnpm run typecheck           - Verify TypeScript types");
  console.log("=================================================\n");

  // Check if API key is present before attempting to launch
  const hasKey =
    config.modelOption.type === "provider"
      ? Boolean(config.modelOption.apiKey)
      : true;

  if (!hasKey) {
    console.log("💡 Notice: No API key detected in your .env file.");
    console.log("   Open .env and set your DEEPSEEK_API_KEY, GROQ_API_KEY, GOOGLE_API_KEY, or OPENAI_API_KEY.\n");
    return;
  }

  console.log("Launching Stagehand session check...");
  const session = await initStagehand();
  try {
    console.log("Browser successfully launched! Current pages:", (await session.browser.context.pages()).length);
    console.log("System is ready for browser automation.");
  } finally {
    await session.close();
  }
}

if (process.argv[1]?.endsWith("index.ts") || process.argv[1]?.endsWith("index.js")) {
  main().catch((err) => {
    console.error("Initialization failed:", err);
  });
}
