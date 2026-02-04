const { GoogleGenAI } = require("@google/genai");
const dotenv = require("dotenv");

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function listModels() {
  try {
    const response = await ai.models.list();
    console.log("Available Models:");
    // The response might be an async iterable or an object depending on SDK version
    // Let's try to iterate or log it
    // SDK v1: response.models
    // New SDK: might differ
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
