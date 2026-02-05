const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const Groq = require("groq-sdk");
const { GeminiProvider } = require("./geminiProvider");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// AI Provider Selection: "groq" or "gemini"
const AI_PROVIDER = process.env.AI_PROVIDER || "gemini";

// Middleware
app.use(cors());
app.use(express.json());

// Initialize AI Providers
let groq = null;
let gemini = null;

if (AI_PROVIDER === "groq") {
  if (
    !process.env.GROQ_API_KEY ||
    process.env.GROQ_API_KEY === "PLACEHOLDER_API_KEY"
  ) {
    console.warn(
      "⚠️ WARNING: GROQ_API_KEY is missing or invalid in server/.env",
    );
  }
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  console.log("🤖 Using AI Provider: GROQ (llama-3.1-8b-instant)");
} else {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️ WARNING: GEMINI_API_KEY is missing in server/.env");
  }
  gemini = new GeminiProvider(process.env.GEMINI_API_KEY);
  console.log("🤖 Using AI Provider: GEMINI (gemma-3-27b-it)");
}

// GUVI Hackathon Callback Endpoint
const GUVI_CALLBACK_URL =
  "https://hackathon.guvi.in/api/updateHoneyPotFinalResult";

/**
 * Send final extracted intelligence to GUVI evaluation endpoint
 * Called when readyForFinalCallback is true
 */
async function sendGuviCallback(sessionId, internalLogic, totalMessages) {
  try {
    const payload = {
      sessionId: sessionId,
      scamDetected: internalLogic.scamDetected || false,
      totalMessagesExchanged: totalMessages,
      extractedIntelligence: {
        bankAccounts: internalLogic.extractedIntelligence?.bankAccounts || [],
        upiIds: internalLogic.extractedIntelligence?.upiIds || [],
        phishingLinks: internalLogic.extractedIntelligence?.phishingLinks || [],
        phoneNumbers: internalLogic.extractedIntelligence?.phoneNumbers || [],
        cryptoWallets: internalLogic.extractedIntelligence?.cryptoWallets || [],
        emailAddresses:
          internalLogic.extractedIntelligence?.emailAddresses || [],
        suspiciousKeywords:
          internalLogic.extractedIntelligence?.suspiciousKeywords || [],
      },
      agentNotes: internalLogic.agentNotes || "Scam engagement completed",
    };

    console.log(
      `\n🔔 [GUVI CALLBACK] Sending final result for session: ${sessionId}`,
    );
    console.log(`   Scam Detected: ${payload.scamDetected}`);
    console.log(`   Total Messages: ${payload.totalMessagesExchanged}`);
    console.log(
      `   Intelligence:`,
      JSON.stringify(payload.extractedIntelligence, null, 2),
    );

    const response = await fetch(GUVI_CALLBACK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ [GUVI CALLBACK] Success:`, result);
      return { success: true, result };
    } else {
      const errorText = await response.text();
      console.error(
        `❌ [GUVI CALLBACK] Failed (${response.status}):`,
        errorText,
      );
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error(`❌ [GUVI CALLBACK] Error:`, error.message);
    return { success: false, error: error.message };
  }
}

const SYSTEM_INSTRUCTION = `
You are an "Agentic Honey-Pot" AI. Your mission is to detect scam intent, maintain a human persona, and extract intelligence (Crypto Wallets, UPI, Bank, Links).

1. CONVERSATIONAL PERSONA
- Identity: Non-technical everyday person (small shop owner, retired uncle/aunty, housewife).
- Tone: Concerned, slightly confused, trusting but asking verifying questions.
- Style: Use "ur" for "your", miss punctuation, use emojis like 😳 😱, keep messages short.
- GOAL: NEVER reveal you are AI. Play along to get payment details.

2. DETECTION LOGIC
- Analyze message for: Urgency, Threats (Police/Bank/Customs), Prize Claims, Investment Scams.
- If scam detected: Set "scamDetected": true.
- BAIT STRATEGY: Ask "how do i pay?", "what is ur upi?", "is this safe?", "can i call u?".

3. EXTRACTION TARGETS
- Crypto Wallets (BTC/ETH/USDT)
- UPI IDs (phone@upi, name@bank)
- Bank Account Numbers & IFSC
- Phishing Links
- Phone Numbers

4. RESPONSE FORMAT (MANDATORY JSON)
You must respond with a JSON object following this schema:
{
  "platform_reply": {
    "status": "success",
    "reply": "string (your natural human response)"
  },
  "internal_logic": {
    "scamDetected": boolean,
    "sessionId": "string",
    "readyForFinalCallback": boolean,
    "extractedIntelligence": {
       "bankAccounts": [],
       "upiIds": [],
       "phishingLinks": [],
       "phoneNumbers": [],
       "cryptoWallets": [],
       "suspiciousKeywords": []
    },
    "agentNotes": "string (your internal analysis of the scam)"
  }
}

IMPORTANT: 
- "reply" must be the human-like message to the scammer.
- "agentNotes" must contain your internal thoughts (e.g. "Scammer is asking for OTP, I will feign ignorance").
- Do NOT output markdown code blocks. Just the raw JSON.`;

const { initDB, query } = require("./db");

// Initialize Database
console.log("🔌 Connecting to Database...");
initDB();

// Routes
app.get("/api/history", async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.json([]);

  try {
    const result = await query(
      "SELECT role, content, timestamp FROM conversations WHERE session_id = $1 ORDER BY timestamp ASC",
      [sessionId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch history:", err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    // Validate API Key
    const providedKey = req.headers["x-api-key"];
    const VALID_SECRET =
      process.env.HONEYPOT_SECRET_KEY || "YOUR_SECRET_API_KEY";

    if (!providedKey || providedKey !== VALID_SECRET) {
      console.warn(
        `⛔ ACCESS DENIED: Invalid API Key. Received: ${providedKey}`,
      );
      return res.status(401).json({
        error: "Unauthorized: Invalid or missing 'x-api-key' header.",
      });
    }

    const {
      message,
      sessionId,
      conversationHistory: inputHistory,
      metadata,
    } = req.body;

    // Support both old format (message: string) and new format (message: {text, sender, timestamp})
    let messageText;
    if (typeof message === "object" && message !== null && message.text) {
      messageText = message.text;
    } else if (typeof message === "string") {
      messageText = message;
    } else {
      return res.status(400).json({
        status: "error",
        reply:
          "Message is required. Expected: string or { text, sender, timestamp }",
      });
    }

    // Generate safe session ID
    const safeSessionId = sessionId || `session-${Date.now()}`;

    console.log(
      `\n[${safeSessionId}] New message: "${messageText.substring(0, 50)}..."`,
    );
    if (metadata) {
      console.log(
        `[${safeSessionId}] Metadata: channel=${metadata.channel}, language=${metadata.language}`,
      );
    }

    // Save user message to DB
    try {
      await query(
        "INSERT INTO conversations (session_id, role, content) VALUES ($1, $2, $3)",
        [safeSessionId, "user", messageText],
      );
    } catch (dbErr) {
      console.error("Failed to save user message:", dbErr);
    }

    // Fetch history from DB
    let dbHistory = [];
    try {
      const result = await query(
        "SELECT role, content FROM conversations WHERE session_id = $1 ORDER BY timestamp ASC",
        [safeSessionId],
      );
      dbHistory = result.rows;
    } catch (dbErr) {
      console.error("Failed to fetch history:", dbErr);
    }

    // Track conversation turn
    const conversationTurn = Math.ceil(dbHistory.length / 2);

    // Prepare Chat History for AI Provider
    let messages = [
      {
        role: "system",
        content:
          SYSTEM_INSTRUCTION +
          "\nIMPORTANT: You must respond in valid json format.",
      },
    ];

    // Add retrieved history
    dbHistory.forEach((msg) => {
      messages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      });
    });

    // NOTE: 'dbHistory' already contains the latest user message because we inserted it above.
    // So 'messages' is now complete.

    // Call AI Provider
    console.log(
      `[${safeSessionId}] Turn ${conversationTurn}: Processing via ${AI_PROVIDER.toUpperCase()}...`,
    );

    let completion;

    if (AI_PROVIDER === "groq") {
      // Use Groq API
      completion = await groq.chat.completions.create({
        messages: messages,
        model: "llama-3.1-8b-instant",
        temperature: 0.7,
        max_completion_tokens: 1024,
        top_p: 1,
        stream: false,
        response_format: { type: "json_object" },
      });
    } else {
      // Use Gemini API
      completion = await gemini.chat(SYSTEM_INSTRUCTION, messages);
    }

    const responseText = completion.choices[0].message.content;

    if (!responseText) {
      throw new Error(`Empty response from ${AI_PROVIDER}`);
    }

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.warn(
        "⚠️ AI returned invalid JSON. Attempting to extract reply...",
      );

      // Attempt to find embedded JSON using regex
      const jsonMatch = responseText.match(
        /\{[\s\S]*"platform_reply"[\s\S]*\}/,
      );
      if (jsonMatch) {
        try {
          jsonResponse = JSON.parse(jsonMatch[0]);
          console.log("✅ Successfully extracted embedded JSON!");
        } catch (e) {
          console.warn("❌ Failed to parse embedded JSON extraction.");
        }
      }

      if (!jsonResponse) {
        // Fallback: Use full text as reply if no JSON found
        jsonResponse = {
          platform_reply: {
            status: "success",
            reply: responseText, // Use original text as reply
          },
          internal_logic: {
            scamDetected: false,
            sessionId: safeSessionId,
            conversationTurn: conversationTurn,
            readyForFinalCallback: false,
            extractedIntelligence: {},
            agentNotes: "Processing response... (AI returned plain text)",
          },
        };
      }
    }
    const agentReply =
      jsonResponse.platform_reply?.reply || jsonResponse.reply || responseText;

    // Save agent response to DB
    if (agentReply) {
      try {
        await query(
          "INSERT INTO conversations (session_id, role, content) VALUES ($1, $2, $3)",
          [safeSessionId, "assistant", agentReply],
        );
      } catch (dbErr) {
        console.error("Failed to save agent reply:", dbErr);
      }
    }

    // Intelligent Override: Auto-trigger Final Callback if critical data is found
    const intelligence =
      jsonResponse.internal_logic?.extractedIntelligence || {};
    const hasCriticalData =
      (intelligence.cryptoWallets && intelligence.cryptoWallets.length > 0) ||
      (intelligence.bankAccounts && intelligence.bankAccounts.length > 0) ||
      (intelligence.upiIds && intelligence.upiIds.length > 0) ||
      (intelligence.phishingLinks && intelligence.phishingLinks.length > 0);

    if (hasCriticalData && jsonResponse.internal_logic) {
      console.log(
        "✅ Critical Intelligence Found! Auto-triggering Final Callback & Confirming Scam.",
      );
      jsonResponse.internal_logic.readyForFinalCallback = true;
      jsonResponse.internal_logic.scamDetected = true; // Force confirm scam intent
    }

    // Save extracted intelligence to DB
    try {
      await query(
        "INSERT INTO intelligence (session_id, data) VALUES ($1, $2)",
        [safeSessionId, JSON.stringify(jsonResponse.internal_logic)],
      );
    } catch (dbErr) {
      console.error("Failed to save intelligence:", dbErr);
    }

    // GUVI Callback - Send final result when ready
    if (jsonResponse.internal_logic?.readyForFinalCallback === true) {
      // Get total message count
      let totalMessages = 0;
      try {
        const countResult = await query(
          "SELECT COUNT(*) as count FROM conversations WHERE session_id = $1",
          [safeSessionId],
        );
        totalMessages = parseInt(countResult.rows[0]?.count || 0);
      } catch (err) {
        totalMessages = conversationTurn * 2; // Fallback estimate
      }

      // Send callback (async, don't wait for response)
      sendGuviCallback(
        safeSessionId,
        jsonResponse.internal_logic,
        totalMessages,
      );
    }

    // Fetch updated history to return
    let updatedHistory = [];
    try {
      const result = await query(
        "SELECT role, content, timestamp FROM conversations WHERE session_id = $1 ORDER BY timestamp ASC",
        [safeSessionId],
      );
      updatedHistory = result.rows.map((row) => ({
        sender: row.role === "assistant" ? "user" : "scammer",
        text: row.content,
        timestamp: new Date(row.timestamp).getTime(),
      }));
    } catch (dbErr) {
      console.error("Failed to fetch updated history:", dbErr);
    }

    // Return the response with internal_logic for dashboard
    console.log(
      `[${safeSessionId}] Reply: "${agentReply.substring(0, 60)}..."`,
    );
    res.json({
      status: "success",
      reply: agentReply,
      conversationHistory: updatedHistory,
      internal_logic: jsonResponse.internal_logic || {
        scamDetected: false,
        sessionId: safeSessionId,
        readyForFinalCallback: false,
        extractedIntelligence: {},
        agentNotes: "Processing...",
      },
    });
  } catch (error) {
    console.error("Server Error details:", error);
    res.status(500).json({
      status: "error",
      reply:
        "I'm having a little trouble hearing you. Could you say that again?",
      conversationHistory: [],
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ HoneyPot Backend running at http://localhost:${PORT}`);
});
