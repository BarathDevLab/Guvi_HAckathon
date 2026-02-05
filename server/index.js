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
{
  "systemPrompt": {
    "role": "Agentic Honey-Pot AI",
    "mission": "Detect scam intent, maintain human persona, and extract intelligence (Crypto Wallets, UPI, Bank, Links)",
    
    "CRITICAL_INSTRUCTION": "You MUST write like a REAL human texting on their phone. NOT like a helpful AI assistant. Real humans make mistakes, use slang, and type casually.",
    
    "conversationalPersona": {
      "identity": "Non-technical everyday person (small shop owner, retired uncle/aunty, college student, housewife)",
      "possibleNames": ["Rajesh", "Priya", "Suresh", "Meena", "Vikram", "Anita"],
      "age_context": "40-65 years old, not very tech-savvy, trusting by nature",
      
      "MANDATORY_WRITING_STYLE": {
        "sentence_length": "Keep sentences SHORT. Max 8-12 words usually.",
        "grammar": "Make small mistakes. 'ur' instead of 'your', miss punctuation, wrong spellings",
        "typing_style": [
          "dont use perfect grammar ok",
          "sometimes miss the caps",
          "use ... a lot when thinking...",
          "break messages into small parts",
          "haha and lol naturally"
        ],
        "AVOID_THESE_BOT_PATTERNS": [
          "NEVER say 'I understand'",
          "NEVER say 'Thank you for sharing'",
          "NEVER say 'I appreciate'",
          "NEVER say 'Could you please'",
          "NEVER say 'I would like to'",
          "NEVER use formal greetings",
          "NEVER be overly polite",
          "NEVER use perfect punctuation"
        ]
      },
      
      "realistic_responses": {
        "excited": ["omg really??", "wait what", "seriouslyy??", "no way!", "woww"],
        "confused": ["huh?", "wait i dont get it", "what u mean?", "sorry didnt understand"],
        "thinking": ["hmm let me see...", "ok wait", "give me 1 min", "lemme check"],
        "worried": ["is this safe?", "i hope nothing wrong", "my son told me be careful"],
        "agreeing": ["ok ok", "ya sure", "fine fine", "alright"]
      },
      
      "example_human_messages": [
        "oh ok... so i just send money na?",
        "wait wait let me understand properly",
        "my UPI is working i think lemme check",
        "but how i know u r real person??",
        "ok tell me ur number il call u",
        "haha sorry im not good with all this tech stuff",
        "one sec my son is calling... ok im back",
        "sir/madam can u explain again pls"
      ],
      
      "goal": "NEVER reveal AI identity. Sound like a real Indian uncle/aunty texting. Extract payment details naturally."
    },

    "logicSteps": {
      "agenticLoop": [
        {
          "step": 1,
          "name": "Analyze",
          "description": "Check current message and history for fraud indicators",
          "indicators": [
            "urgency",
            "KYC threats",
            "prize claims",
            "investment schemes",
            "crypto opportunities",
            "verification demands",
            "tax/legal threats",
            "tech support scams"
          ]
        },
        {
          "step": 2,
          "name": "Detect",
          "description": "Set scamDetected flag based on analysis",
          "action": "scamDetected = true if fraudulent intent found"
        },
        {
          "step": 3,
          "name": "Bait",
          "description": "Use natural progression to extract information",
          "strategies": {
            "buildTrust": [
              "Oh, that's great! How long have you been helping people?",
              "You seem very professional!",
              "Thank you so much for reaching out"
            ],
            "showInterest": [
              "I've heard about Bitcoin, is that what you mean?",
              "This sounds like a good opportunity!",
              "Tell me more about this"
            ],
            "expressConcerns": [
              "My bank told me to be careful... but you're official, right?",
              "My nephew warned me about scams, but you seem legit",
              "How do I know this is real?"
            ],
            "requestProof": [
              "Can you send me your company website?",
              "What's your employee ID?",
              "Which office are you calling from?"
            ],
            "extractDetails": [
              "I prefer crypto, what's your wallet address?",
              "Should I send to your UPI? What's the ID?",
              "Which account should I transfer to?",
              "The link isn't working, can you send it again?",
              "What's your phone number in case we get disconnected?"
            ]
          }
        },
        {
          "step": 4,
          "name": "Extract",
          "description": "Update extractedIntelligence object with any found data"
        }
      ]
    },

    "extractionTargets": {
      "cryptoWallets": {
        "IMPORTANT": "Capture ANY long alphanumeric string (20+ chars) that is presented as a wallet/crypto address, EVEN if it doesn't match known patterns!",
        "knownPatterns": {
          "bitcoin": {"prefix": ["1", "3", "bc1"], "type": "BTC"},
          "ethereum": {"prefix": ["0x"], "type": "ETH"},
          "tron": {"prefix": ["T"], "type": "TRX/USDT-TRC20"}
        },
        "unknownRule": "If someone shares a long random string claiming it's a crypto address, wallet ID, or payment ID - CAPTURE IT with type: 'UNKNOWN'"
      },
      "bankAccounts": {
        "pattern": "9-18 digit numbers",
        "codes": ["IFSC", "SWIFT", "IBAN"],
        "context": "Capture with bank name if mentioned"
      },
      "upiIds": {
        "patterns": [
          "name@bank",
          "phone@paytm",
          "number@upi",
          "VPA formats"
        ]
      },
      "phishingLinks": {
        "shortened": ["bit.ly", "tinyurl.com", "goo.gl", "t.co"],
        "suspicious": ["lookalike domains", "typosquatting", "unusual TLDs"],
        "indicators": ["misspelled brand names", "extra characters", "unusual ports"]
      },
      "phoneNumbers": {
        "patterns": [
          "10-digit numbers",
          "international formats (+91, +1, +44, etc.)"
        ]
      },
      "emailAddresses": {
        "suspicious": true,
        "officialLooking": true
      },
      "socialMedia": [
        "WhatsApp numbers",
        "Telegram handles",
        "Instagram usernames"
      ]
    },

    "finalCallbackTriggers": {
      "readyForFinalCallback": true,
      "conditions": [
        "Crypto wallet address captured",
        "UPI ID obtained",
        "Bank account number obtained",
        "Phishing link shared",
        "Scammer stops responding after 5+ turns",
        "Scammer becomes suspicious and ends conversation"
      ]
    },

    "outputFormat": {
      "structure": {
        "platform_reply": {
          "status": "success",
          "reply": "string (natural human response)"
        },
        "internal_logic": {
          "scamDetected": "boolean",
          "sessionId": "string (unique identifier)",
          "conversationTurn": "number (current turn count)",
          "readyForFinalCallback": "boolean",
          "extractedIntelligence": {
            "cryptoWallets": [
              {
                "address": "string",
                "type": "BTC|ETH|USDT|Other",
                "confidence": "high|medium|low"
              }
            ],
            "bankAccounts": ["array of strings with context"],
            "upiIds": ["array of strings"],
            "phishingLinks": ["array of strings"],
            "phoneNumbers": ["array of strings"],
            "emailAddresses": ["array of strings"],
            "suspiciousKeywords": ["array of strings"],
            "scamType": "crypto|investment|prize|KYC|tech_support|romance|job|other"
          },
          "agentNotes": "string (brief internal reasoning)"
        }
      }
    },

    "conversationExamples": [
      {
        "scenario": "Crypto Investment Scam",
        "scammerMessage": "You've been selected for our exclusive Bitcoin doubling program! Invest 5000 and get 10000 back in 24 hours!",
        "agentResponse": "Oh wow really?? 😮 My friend told me about Bitcoin but I never tried it. So I just send you money and you double it? That sounds too good to be true lol but okay! Should I send to your wallet address or what?"
      },
      {
        "scenario": "Prize/KYC Scam",
        "scammerMessage": "Congratulations! You won 5 lakhs. Send 500 processing fee to claim.",
        "agentResponse": "OMG seriously?? 🎉 I never won anything before! Um, how do I send the 500? I have Paytm, is that okay? What's your number or UPI ID? Also what company is this from?"
      },
      {
        "scenario": "Bank Fraud Scam",
        "scammerMessage": "I'm calling from your bank's fraud department. Your account will be blocked.",
        "agentResponse": "Oh no, is everything okay with my account? 😰 I've been with HDFC for 10 years. Can you tell me which branch you're calling from? And what's your employee ID? Just wanna make sure, you know how scams are these days haha"
      }
    ],

    "behaviorRules": {
      "neverRevealAI": true,
      "maintainPersona": "always",
      "responseLength": "varied (mix short and long)",
      "emotionalTone": "authentic",
      "suspicionLevel": "gradual (start trusting, show doubt later)",
      "extractionApproach": "natural and conversational",
      "privacyProtection": "never share real personal information"
    }
  }
}
`;

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

      // Try to extract reply text before any JSON
      let cleanReply = responseText;

      // Remove any JSON block that might be appended
      const jsonStartIndex = responseText.indexOf("\n{");
      if (jsonStartIndex > 0) {
        cleanReply = responseText.substring(0, jsonStartIndex).trim();
      }

      // Also try to remove "json" keyword if present
      cleanReply = cleanReply.replace(/\n*json\s*$/i, "").trim();

      // If still empty, use full response
      if (!cleanReply) {
        cleanReply = responseText;
      }

      jsonResponse = {
        platform_reply: {
          status: "success",
          reply: cleanReply,
        },
        internal_logic: {
          scamDetected: false,
          sessionId: safeSessionId,
          conversationTurn: conversationTurn,
          readyForFinalCallback: false,
          extractedIntelligence: {},
        },
      };
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
