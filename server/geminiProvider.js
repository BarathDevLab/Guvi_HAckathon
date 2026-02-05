/**
 * Gemini AI Provider
 * Uses Google's Gemma 3 27B model
 */

const { GoogleGenAI } = require("@google/genai");

class GeminiProvider {
  constructor(apiKey) {
    this.ai = new GoogleGenAI({ apiKey });
    this.modelName = "gemma-3-27b-it";
  }

  async chat(systemPrompt, messages) {
    try {
      // Convert OpenAI-style messages to Gemini 'contents'
      // Filter out 'system' messages initially
      let chatContents = messages
        .filter((msg) => msg.role !== "system")
        .map((msg) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        }));

      // Ingest system prompt into the first message or prepend it
      if (systemPrompt) {
        if (chatContents.length > 0 && chatContents[0].role === "user") {
          // Prepend to first user message
          chatContents[0].parts[0].text = `System: ${systemPrompt}\n\nUser: ${chatContents[0].parts[0].text}`;
        } else {
          // Prepend a new user message
          chatContents.unshift({
            role: "user",
            parts: [{ text: `System: ${systemPrompt}` }],
          });
        }
      }

      const result = await this.ai.models.generateContent({
        model: this.modelName,
        contents: chatContents,
        config: {
          // systemInstruction removed as it is not supported for gemma-3-27b-it
          // responseMimeType removed as it is not supported for gemma-3-27b-it
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      });

      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // Clean markdown code blocks (```json ... ```)
      const cleanText = responseText.replace(/```json\n?|\n?```/g, "").trim();

      return {
        choices: [
          {
            message: {
              content: cleanText,
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
