import { GoogleGenerativeAI } from "@google/generative-ai";

export default function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}
