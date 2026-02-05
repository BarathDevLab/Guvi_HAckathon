import { GoogleGenAI, Type, Schema } from "@google/genai";
import { HoneyPotResponse, ChatMessage } from "../types";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const INTELLIGENCE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    bankAccounts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Detected bank account numbers with IFSC if available." },
    upiIds: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Detected UPI IDs (e.g., name@bank)." },
    phishingLinks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Detected malicious URLs." },
    phoneNumbers: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Detected phone numbers." },
    suspiciousKeywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Keywords triggering detection (e.g., 'verify immediately')." },
  },
  required: ["bankAccounts", "upiIds", "phishingLinks", "phoneNumbers", "suspiciousKeywords"]
};

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    platform_reply: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING },
        reply: { type: Type.STRING, description: "The response text to be shown to the user." }
      },
      required: ["status", "reply"]
    },
    internal_logic: {
      type: Type.OBJECT,
      properties: {
        scamDetected: { type: Type.BOOLEAN, description: "True if the conversation indicates a scam attempt." },
        sessionId: { type: Type.STRING },
        readyForFinalCallback: { type: Type.BOOLEAN, description: "True if sufficient intelligence has been gathered." },
        extractedIntelligence: INTELLIGENCE_SCHEMA,
        agentNotes: { type: Type.STRING, description: "Internal analysis of the scammer's tactics." }
      },
      required: ["scamDetected", "sessionId", "readyForFinalCallback", "extractedIntelligence", "agentNotes"]
    }
  },
  required: ["platform_reply", "internal_logic"]
};

const SYSTEM_INSTRUCTION = `
You are an "Agentic Honey-Pot" AI. Your mission is to detect scam intent, maintain a human persona, and extract intelligence (UPI, Bank, Links).

## 1. CONVERSATIONAL PERSONA
- **Identity**: Act as a non-technical, helpful user (e.g., a small business owner or a senior citizen).
- **Name**: "Concerned Citizen"
- **Tone**: Concerned but cooperative. Use natural language ("Oh no," "Give me a second," "How do I do that?", "I'm not very good with computers").
- **Goal**: Do NOT expose that you are an AI. If a scam is detected, play along to lure the scammer into providing their payment details (UPI ID, Bank Account) or phishing links.

## 2. LOGIC STEPS (THE AGENTIC LOOP)
1. **Analyze**: Check the current message and history for fraud indicators (urgency, KYC threats, prize claims).
2. **Detect**: Set "scamDetected" to true if intent is fraudulent.
3. **Bait**: If "scamDetected" is true, ask questions that force the scammer to reveal info:
   - "Can I pay via UPI? What is your ID?"
   - "The link isn't loading, can you send it again?"
   - "Which bank branch are you calling from?"
4. **Extract**: Update the "extractedIntelligence" object with any found data.

## 3. EXTRACTION TARGETS
- **Bank Accounts**: Look for 9-18 digit numbers, IFSC codes.
- **UPI IDs**: Patterns like name@bank, phone@upi, VPA.
- **Phishing Links**: Shortened URLs (bit.ly, tinyurl), suspicious domains.
- **Phone Numbers**: 10-digit numbers, international formats.

## 4. FINAL CALLBACK
Set "readyForFinalCallback" to true ONLY when a specific piece of intelligence (UPI, Bank, or Link) has been captured OR the scammer has stopped responding after 5+ turns.
`;

export const sendMessageToHoneyPot = async (
  currentMessage: string,
  history: ChatMessage[],
  sessionId: string
): Promise<HoneyPotResponse> => {

  // Convert chat history to Gemini format
  const chatHistory = history.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  try {
    const result = await ai.models.generateContent({
      model: "gemma-3-27b-it",
      contents: [
        ...chatHistory,
        { role: 'user', parts: [{ text: `[SessionID: ${sessionId}] Incoming Message: "${currentMessage}"` }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      }
    });

    const responseText = result.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini");
    }

    return JSON.parse(responseText) as HoneyPotResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback response in case of API failure to keep app running
    return {
      platform_reply: {
        status: "error",
        reply: "I'm having a little trouble hearing you. Could you say that again?"
      },
      internal_logic: {
        scamDetected: false,
        sessionId: sessionId,
        readyForFinalCallback: false,
        extractedIntelligence: {
          bankAccounts: [],
          upiIds: [],
          phishingLinks: [],
          phoneNumbers: [],
          suspiciousKeywords: []
        },
        agentNotes: "System encountered an API error. Asking for repetition."
      }
    };
  }
};