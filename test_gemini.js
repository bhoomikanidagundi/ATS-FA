import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

async function test() {
  const models = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-flash"];
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  
  for (const modelName of models) {
    try {
      console.log(`Testing model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Say hello in one word");
      console.log(`  ✅ ${modelName}: ${result.response.text().trim()}`);
    } catch (e) {
      console.log(`  ❌ ${modelName}: ${e.message}`);
    }
  }
}
test();
