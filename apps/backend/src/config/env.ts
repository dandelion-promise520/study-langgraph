export const env = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 8080,
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || "http://127.0.0.1:8045/v1",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "sk-9ad190d5bace4ac19b0a108b428ac460",
  OPENAI_MODEL_NAME: process.env.OPENAI_MODEL_NAME || "gemini-3.7-flash-low",
};
