/**
 * Gemini AI Provider
 * Uses Google's Gemini Gamma 3 27B model
 */

const { GoogleGenerativeAI } = require("@google/genai");

class GeminiProvider {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: "gemma-3-27b-it",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });
  }

  async chat(systemPrompt, messages) {
    try {
      // Build conversation history for Gemini
      const history = messages.slice(0, -1).map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));

      // Get the last user message
      const lastMessage = messages[messages.length - 1];

      // Start chat with history
      const chat = this.model.startChat({
        history: [
          { role: "user", parts: [{ text: "System: " + systemPrompt }] },
          {
            role: "model",
            parts: [{ text: "Understood. I will follow these instructions." }],
          },
          ...history,
        ],
      });

      // Send the current message
      const result = await chat.sendMessage(lastMessage.content);
      const responseText = result.response.text();

      return {
        choices: [
          {
            message: {
              content: responseText,
            },
          },
        ],
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}

module.exports = { GeminiProvider };
