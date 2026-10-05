/**
 * Ensures any object passed to page.evaluate is 100% compliant JSON,
 * stripping out any `undefined` values that violate Zod's z.json() validation in Stagehand.
 */
export function safeArg<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}
