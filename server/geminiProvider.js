/**
 * Gemini AI Provider
 * Uses Google's Gemma 3 27B model (with fallback to Gemini models)
 */

const { GoogleGenAI } = require("@google/genai");

class GeminiProvider {
  constructor(apiKey) {
    this.ai = new GoogleGenAI({ apiKey });
    this.modelName = "gemma-3-27b-it";
  }

  async chat(systemPrompt, messages) {
    const MAX_RETRIES = 3;
    const models = [this.modelName, "gemini-2.0-flash", "gemini-1.5-flash"];

    // Retry Loop
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      for (const model of models) {
        try {
          if (attempt > 1 || model !== this.modelName) {
            console.log(
              `⚠️ Retry ${attempt}/${MAX_RETRIES} using model: ${model}`,
            );
          }

          console.log(`[GEMINI] Calling ${model}...`);

          // Check model capabilities
          const isGemini = model.startsWith("gemini-");
          const isGemma = model.startsWith("gemma-");

          // Prepare content - filter out system messages
          let chatContents = messages
            .filter((msg) => msg.role !== "system")
            .map((msg) => ({
              role: msg.role === "assistant" ? "model" : "user",
              parts: [{ text: msg.content }],
            }));

          // For Gemma: prepend system prompt to first user message
          // For Gemini: use systemInstruction parameter
          let apiParams = {
            model: model,
            contents: chatContents,
            config: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            },
          };

          if (isGemini) {
            // Gemini supports systemInstruction and JSON mode
            apiParams.systemInstruction = systemPrompt;
            apiParams.config.responseMimeType = "application/json";
          } else if (isGemma) {
            // Gemma: inject system prompt into first message
            if (chatContents.length > 0 && chatContents[0].role === "user") {
              chatContents[0].parts[0].text = `[System Instructions]\n${systemPrompt}\n\n[User Message]\n${chatContents[0].parts[0].text}`;
            } else {
              chatContents.unshift({
                role: "user",
                parts: [{ text: `[System Instructions]\n${systemPrompt}` }],
              });
            }
          }

          const result = await this.ai.models.generateContent(apiParams);

          const responseText =
            result.candidates?.[0]?.content?.parts?.[0]?.text || "";

          // Clean and extract JSON from response
          let cleanText = responseText.trim();

          // Remove markdown code blocks
          cleanText = cleanText.replace(/```json\n?|\n?```/g, "").trim();

          // Try to extract JSON if it's embedded in the response
          // Pattern: text before JSON, then JSON object
          const jsonMatch = cleanText.match(
            /\{[\s\S]*"platform_reply"[\s\S]*\}/,
          );
          if (jsonMatch) {
            cleanText = jsonMatch[0];
          } else {
            // Try to find any JSON object at the end
            const lastJsonMatch = cleanText.match(
              /\{[^{}]*("status"|"reply")[^{}]*\}[\s\S]*$/,
            );
            if (lastJsonMatch) {
              cleanText = lastJsonMatch[0];
            }
          }

          return {
            choices: [{ message: { content: cleanText } }],
          };
        } catch (error) {
          const errorMsg = error.message || "";
          const isOverloaded =
            errorMsg.includes("503") ||
            errorMsg.includes("overloaded") ||
            error.status === 503;
          const isQuotaExceeded =
            errorMsg.includes("quota") || errorMsg.includes("429");
          const isUnsupportedFeature =
            errorMsg.includes("not enabled") ||
            errorMsg.includes("not supported") ||
            error.status === 400;

          if (isOverloaded || isQuotaExceeded || isUnsupportedFeature) {
            const reason = isQuotaExceeded
              ? "Quota Exceeded"
              : isUnsupportedFeature
                ? "Feature not supported"
                : "Overloaded";
            console.warn(`⚠️ Model ${model} - ${reason}. Trying next...`);

            if (
              model === models[models.length - 1] &&
              attempt === MAX_RETRIES
            ) {
              throw error; // All models exhausted
            }
            await new Promise((r) => setTimeout(r, 500));
            continue;
          }

          // Other errors - throw immediately
          console.error("Gemini API Error:", error);
          throw error;
        }
      }
    }
  }
}

module.exports = { GeminiProvider };
