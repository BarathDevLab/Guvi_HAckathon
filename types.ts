export interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: Date;
}

export interface CryptoWallet {
  address: string;
  type: string;
  confidence?: string;
}

export interface ExtractedIntelligence {
  cryptoWallets?: CryptoWallet[];
  bankAccounts?: string[];
  upiIds?: string[];
  phishingLinks?: string[];
  phoneNumbers?: string[];
  emailAddresses?: string[];
  suspiciousKeywords?: string[];
  scamType?: string;
}

export interface InternalLogicState {
  scamDetected: boolean;
  readyForFinalCallback: boolean;
  sessionId: string;
  extractedIntelligence: ExtractedIntelligence;
  agentNotes: string;
}

export interface PlatformReply {
  status: string;
  reply: string;
}

export interface HoneyPotResponse {
  status: string;
  reply?: string;
  platform_reply?: PlatformReply;
  internal_logic?: InternalLogicState;
  conversationHistory?: Array<{
    sender: string;
    text: string;
    timestamp: number;
  }>;
}

export enum AgentStatus {
  IDLE = "IDLE",
  ANALYZING = "ANALYZING",
  BAITING = "BAITING",
  REPORTING = "REPORTING",
}
