const { GoogleGenAI } = require("@google/genai");
const dotenv = require("dotenv");
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testModel() {
    try {
        console.log("Testing model: gemma-3-27b-it");
        const response = await ai.models.generateContent({
            model: "gemma-3-27b-it",
            contents: [
                { role: "user", parts: [{ text: "Hello, answer in one word." }] }
            ]
        });
        console.log("Success. Response: " + JSON.stringify(response));
    } catch (error) {
        console.error("Error: " + error.message);
        if (error.body) {
            console.error("Error Body:", error.body);
        }
    }
}

testModel();
