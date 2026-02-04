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
  const [internalState, setInternalState] = useState<InternalLogicState>(
    INITIAL_INTERNAL_STATE,
  );
  const [agentStatus, setAgentStatus] = useState<AgentStatus>(AgentStatus.IDLE);
  const [isLoading, setIsLoading] = useState(false);

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

    // 2. CALL THE REST API (Simulated)
    // We strictly use the API layer with the required Headers.
    try {
      const apiResponse = await handleApiRequest({
        method: "POST",
        headers: {
          // WE INJECT THE SECRET KEY HERE
          // In a real scenario, this is done by the client (Postman/Curl/Frontend App)
          "x-api-key": "YOUR_SECRET_API_KEY",
        },
        body: {
          message: text,
          history: messages,
          sessionId: internalState.sessionId,
        },
      });

      // 3. Handle API Errors (e.g., 401 Unauthorized)
      if (apiResponse.status !== 200 || !apiResponse.data) {
        throw new Error(
          apiResponse.error || `API Error: ${apiResponse.status}`,
        );
      }

      const responseData = apiResponse.data;

      // 4. Update Application State from API Response - MERGE intelligence data
      setInternalState((prevState) => {
        const newLogic = responseData.internal_logic;
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
          ...newLogic,
          sessionId: prevState.sessionId, // Keep original session ID
          scamDetected: prevState.scamDetected || newLogic.scamDetected, // Once detected, stay detected
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
      if (responseData.internal_logic.scamDetected) {
        setAgentStatus(AgentStatus.BAITING);
      } else {
        setAgentStatus(AgentStatus.IDLE);
      }

      if (responseData.internal_logic.readyForFinalCallback) {
        setAgentStatus(AgentStatus.REPORTING);
        console.log("CALLBACK TRIGGERED:", responseData.internal_logic);
      }

      // 5. Add Agent Reply to UI
      const agentMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "agent",
        text: responseData.platform_reply.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMsg]);
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
        <div className="w-full md:w-1/2 lg:w-2/5 h-full border-r border-gray-800">
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
