import React, { useState } from "react";
import ChatInterface from "./components/ChatInterface";
import Dashboard from "./components/Dashboard";
import { handleApiRequest } from "./services/honeyPotApi";
import { ChatMessage, InternalLogicState, AgentStatus } from "./types";

// Initial dummy state
const INITIAL_INTERNAL_STATE: InternalLogicState = {
  scamDetected: false,
  readyForFinalCallback: false,
  sessionId: `SESS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
  extractedIntelligence: {
    cryptoWallets: [],
    bankAccounts: [],
    upiIds: [],
    phishingLinks: [],
    phoneNumbers: [],
    emailAddresses: [],
    suspiciousKeywords: [],
    scamType: undefined,
  },
  agentNotes: "System Online. REST API listening for events...",
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Initialize state with lazy initializer to check localStorage first
  const [internalState, setInternalState] = useState<InternalLogicState>(() => {
    const savedSessionId = localStorage.getItem("honeyPotSessionId");
    return {
      ...INITIAL_INTERNAL_STATE,
      sessionId:
        savedSessionId ||
        `SESS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    };
  });

  const [agentStatus, setAgentStatus] = useState<AgentStatus>(AgentStatus.IDLE);
  const [isLoading, setIsLoading] = useState(false);

  // Effect to save session ID whenever it changes
  React.useEffect(() => {
    if (internalState.sessionId) {
      localStorage.setItem("honeyPotSessionId", internalState.sessionId);
    }
  }, [internalState.sessionId]);

  // Load history on mount or session change
  React.useEffect(() => {
    if (!internalState.sessionId) return;

    // Fetch history
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const API_URL =
          import.meta.env.VITE_BACKEND_URL?.replace(
            "/api/chat",
            "/api/history",
          ) || "http://localhost:3000/api/history";
        const res = await fetch(
          `${API_URL}?sessionId=${internalState.sessionId}`,
        );
        if (res.ok) {
          const data = await res.json();
          // Convert to ChatMessage format
          const historyMsgs: ChatMessage[] = data.map(
            (msg: any, index: number) => ({
              id: `hist-${index}`,
              sender: msg.role === "user" ? "user" : "agent",
              text: msg.content,
              timestamp: new Date(msg.timestamp),
            }),
          );
          setMessages(historyMsgs);
        }
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [internalState.sessionId]);

  const handleNewChat = () => {
    localStorage.removeItem("honeyPotSessionId");
    setMessages([]);
    setInternalState({
      ...INITIAL_INTERNAL_STATE,
      sessionId: `SESS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    });
    setAgentStatus(AgentStatus.IDLE);
  };

  const handleUserMessage = async (text: string) => {
    // 1. Add User (Scammer) Message to UI
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setAgentStatus(AgentStatus.ANALYZING);

    try {
      const apiResponse = await handleApiRequest({
        method: "POST",
        headers: {
          "x-api-key": "YOUR_SECRET_API_KEY",
        },
        body: {
          message: text,
          sessionId: internalState.sessionId,
        },
      });

      if (apiResponse.status !== 200 || !apiResponse.data) {
        throw new Error(
          apiResponse.error || `API Error: ${apiResponse.status}`,
        );
      }

      const responseData = apiResponse.data;

      // Update Application State - MERGE intelligence data (only if internal_logic exists)
      const newLogic: Partial<InternalLogicState> =
        responseData.internal_logic || {};

      if (newLogic && Object.keys(newLogic).length > 0) {
        setInternalState((prevState) => {
          const prevIntel = prevState.extractedIntelligence || {};
          const newIntel = newLogic.extractedIntelligence || {};

          // Helper to merge arrays and remove duplicates
          const mergeArrays = (prev: string[] = [], next: string[] = []) => {
            return [...new Set([...prev, ...next])];
          };

          // Helper to merge crypto wallets (by address)
          const mergeCryptoWallets = (prev: any[] = [], next: any[] = []) => {
            const map = new Map();
            [...prev, ...next].forEach((wallet) => {
              if (wallet?.address) map.set(wallet.address, wallet);
            });
            return Array.from(map.values());
          };

          return {
            ...prevState,
            ...newLogic,
            sessionId: prevState.sessionId, // Keep original session ID
            scamDetected:
              prevState.scamDetected || newLogic.scamDetected || false,
            extractedIntelligence: {
              cryptoWallets: mergeCryptoWallets(
                prevIntel.cryptoWallets,
                newIntel.cryptoWallets,
              ),
              bankAccounts: mergeArrays(
                prevIntel.bankAccounts,
                newIntel.bankAccounts,
              ),
              upiIds: mergeArrays(prevIntel.upiIds, newIntel.upiIds),
              phishingLinks: mergeArrays(
                prevIntel.phishingLinks,
                newIntel.phishingLinks,
              ),
              phoneNumbers: mergeArrays(
                prevIntel.phoneNumbers,
                newIntel.phoneNumbers,
              ),
              emailAddresses: mergeArrays(
                prevIntel.emailAddresses,
                newIntel.emailAddresses,
              ),
              suspiciousKeywords: mergeArrays(
                prevIntel.suspiciousKeywords,
                newIntel.suspiciousKeywords,
              ),
              scamType: newIntel.scamType || prevIntel.scamType,
            },
          };
        });

        // Determine Agent Status for Dashboard
        if (newLogic.scamDetected) {
          setAgentStatus(AgentStatus.BAITING);
        } else {
          setAgentStatus(AgentStatus.IDLE);
        }

        if (newLogic.readyForFinalCallback) {
          setAgentStatus(AgentStatus.REPORTING);
        }
      }

      // Add Agent Reply to UI
      if (
        responseData.conversationHistory &&
        responseData.conversationHistory.length > 0
      ) {
        // Convert DB history to ChatMessage format
        const dbHistoryUpdates: ChatMessage[] =
          responseData.conversationHistory.map((msg: any, index: number) => ({
            id: `hist-${index}-${Date.now()}`,
            sender: msg.sender === "scammer" ? "user" : "agent",
            text: msg.text,
            timestamp: new Date(msg.timestamp || Date.now()),
          }));
        setMessages(dbHistoryUpdates);
      } else {
        // Fallback: use direct reply field
        const replyText =
          responseData.reply ||
          responseData.platform_reply?.reply ||
          "No response";
        const agentMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "agent",
          text: replyText,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, agentMsg]);
      }
    } catch (error) {
      console.error("Transaction Failed:", error);
      // Fallback message if API fails (e.g., wrong key)
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: "agent",
        text: "⚠️ SYSTEM ERROR: API Authorization Failed or Service Unavailable.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-900">
      <div className="flex w-full h-full max-w-7xl mx-auto shadow-2xl overflow-hidden">
        {/* Left Side: The Chat Interface */}
        <div className="w-full md:w-1/2 lg:w-2/5 h-full border-r border-gray-800 flex flex-col">
          <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-white font-semibold">HoneyPot Chat</h2>
            <button
              onClick={handleNewChat}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
            >
              New Chat
            </button>
          </div>
          <ChatInterface
            messages={messages}
            onSendMessage={handleUserMessage}
            isLoading={isLoading}
            internalState={internalState}
          />
        </div>

        {/* Right Side: The Dashboard */}
        <div className="hidden md:block md:w-1/2 lg:w-3/5 h-full relative">
          <Dashboard internalState={internalState} status={agentStatus} />
        </div>
      </div>
    </div>
  );
};

export default App;
