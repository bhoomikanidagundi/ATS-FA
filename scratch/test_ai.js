import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function testAI() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: "Hello, respond with 'Success' if you can read this.",
    });
    console.log("AI Response:", response.text);
  } catch (error) {
    console.error("AI Error:", error.message);
  }
}

testAI();
