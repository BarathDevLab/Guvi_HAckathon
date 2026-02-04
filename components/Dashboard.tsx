import React from "react";
import {
  Shield,
  Terminal,
  Eye,
  Database,
  Lock,
  AlertOctagon,
  Activity,
  CheckCircle2,
  Share2,
  Code,
} from "lucide-react";
import { InternalLogicState, AgentStatus } from "../types";

interface DashboardProps {
  internalState: InternalLogicState;
  status: AgentStatus;
}

const Dashboard: React.FC<DashboardProps> = ({ internalState, status }) => {
  const { extractedIntelligence, scamDetected, agentNotes } = internalState;

  return (
    <div className="h-full bg-terminal-bg text-terminal-text font-mono p-6 overflow-y-auto flex flex-col gap-6 border-l border-slate-700 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-4">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-emerald-500" />
          <div>
            <h1 className="text-xl font-bold text-white tracking-wider">
              AGENT_HONEYPOT
            </h1>
            <p className="text-xs text-slate-400">
              INTELLIGENCE EXTRACTION SYSTEM v1.0
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${status === AgentStatus.ANALYZING ? "animate-pulse bg-yellow-500" : "bg-emerald-500"}`}
          ></div>
          <span className="text-xs font-bold text-slate-300">{status}</span>
        </div>
      </div>

      {/* Threat Level */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className={`p-4 rounded border ${scamDetected ? "border-red-500 bg-red-900/10" : "border-emerald-500 bg-emerald-900/10"}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertOctagon
              className={`w-5 h-5 ${scamDetected ? "text-red-500" : "text-emerald-500"}`}
            />
            <span className="text-sm font-bold text-white">
              THREAT DETECTION
            </span>
          </div>
          <p
            className={`text-2xl font-bold ${scamDetected ? "text-red-400" : "text-emerald-400"}`}
          >
            {scamDetected ? "MALICIOUS" : "SAFE"}
          </p>
        </div>

        <div className="p-4 rounded border border-slate-700 bg-slate-800/30">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-bold text-white">AGENT STRATEGY</span>
          </div>
          <p className="text-sm text-slate-300 leading-tight">
            {scamDetected
              ? "HONEYPOT ACTIVE: Baiting for credentials."
              : "PASSIVE: Monitoring conversation flow."}
          </p>
        </div>
      </div>

      {/* Live Agent Thoughts */}
      <div className="border border-slate-700 rounded bg-slate-900/50 flex flex-col">
        <div className="bg-slate-800/50 p-2 border-b border-slate-700 flex items-center gap-2">
          <Eye className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-slate-300">
            INTERNAL_MONOLOGUE
          </span>
        </div>
        <div className="p-4 min-h-[100px]">
          <p className="text-sm text-purple-200 opacity-90 typing-effect">
            {agentNotes || "Waiting for input..."}
          </p>
        </div>
      </div>

      {/* Extracted Intelligence */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-white">
          <Database className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold">EXTRACTED INTELLIGENCE</h3>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* Crypto Wallets */}
          <IntelCard
            label="CRYPTO WALLETS"
            items={(extractedIntelligence.cryptoWallets || []).map(
              (w) => `${w.address} (${w.type})`,
            )}
            icon={<Database className="w-3 h-3" />}
            emptyText="No wallets detected"
            danger={true}
          />

          {/* Bank Accounts */}
          <IntelCard
            label="BANK ACCOUNTS"
            items={extractedIntelligence.bankAccounts}
            icon={<Lock className="w-3 h-3" />}
            emptyText="No accounts detected"
          />

          {/* UPI IDs */}
          <IntelCard
            label="UPI HANDLES"
            items={extractedIntelligence.upiIds}
            icon={<Share2 className="w-3 h-3" />}
            emptyText="No VPA detected"
          />

          {/* Phone Numbers */}
          <IntelCard
            label="PHONE NUMBERS"
            items={extractedIntelligence.phoneNumbers}
            icon={<Terminal className="w-3 h-3" />}
            emptyText="No numbers detected"
          />

          {/* Links */}
          <IntelCard
            label="PHISHING LINKS"
            items={extractedIntelligence.phishingLinks}
            icon={<AlertOctagon className="w-3 h-3" />}
            emptyText="No links detected"
            danger={true}
          />
        </div>
      </div>

      {/* API Documentation / Sample Request Visualizer */}
      <div className="border border-slate-700 rounded bg-slate-900/50 flex flex-col shrink-0">
        <div className="bg-slate-800/50 p-2 border-b border-slate-700 flex items-center gap-2">
          <Code className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-slate-300">
            PAYLOAD_VISUALIZER (INTERNAL)
          </span>
        </div>
        <div className="p-4 bg-slate-950/80 font-mono text-[10px] text-slate-400 overflow-x-auto relative">
          <div className="absolute top-2 right-2 border border-amber-500/30 text-amber-500 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
            Simulation Mode
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-slate-500 border-b border-slate-800 pb-2 mb-1">
              <span className="text-red-400 font-bold">NOTE:</span> This logic
              is running inside the browser. The domain{" "}
              <span className="text-slate-300">api.honeypot.guvi</span> is
              fictional.
              <br />
              Postman cannot connect to this simulation directly.
            </div>

            <div>
              <div className="text-slate-500 mb-1 font-bold text-[9px]">
                ACTIVE PAYLOAD STRUCTURE:
              </div>
              <div className="flex flex-wrap font-mono text-xs">
                <span className="text-amber-500">{`{`}</span>
                <div className="pl-4 w-full">
                  <span className="text-blue-300">"sessionId"</span>:{" "}
                  <span className="text-amber-200">
                    "{internalState.sessionId}"
                  </span>
                  ,
                </div>
                <div className="pl-4 w-full">
                  <span className="text-blue-300">"headers"</span>:{" "}
                  <span className="text-amber-200">{`{ "x-api-key": "YOUR_SECRET_API_KEY" }`}</span>
                  ,
                </div>
                <div className="pl-4 w-full">
                  <span className="text-blue-300">"message"</span>:{" "}
                  <span className="text-amber-200">"[Current User Input]"</span>
                </div>
                <span className="text-amber-500">{`}`}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer System Status */}
      <div className="border-t border-slate-700 pt-4 flex items-center justify-between text-[10px] text-slate-500">
        <span>SESSION: {internalState.sessionId}</span>
        <div className="flex items-center gap-2">
          <span>CALLBACK READY:</span>
          <span
            className={`w-2 h-2 rounded-full ${internalState.readyForFinalCallback ? "bg-green-500" : "bg-red-500"}`}
          ></span>
        </div>
      </div>
    </div>
  );
};

const IntelCard = ({
  label,
  items = [],
  icon,
  emptyText,
  danger = false,
}: {
  label: string;
  items?: string[];
  icon: React.ReactNode;
  emptyText: string;
  danger?: boolean;
}) => {
  const safeItems = items || [];
  return (
    <div className="bg-slate-800/40 border border-slate-700 rounded p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
          {icon} {label}
        </span>
        <span className="text-[10px] bg-slate-700 px-1.5 rounded text-slate-300">
          {safeItems.length}
        </span>
      </div>
      {safeItems.length > 0 ? (
        <ul className="space-y-1">
          {safeItems.map((item, idx) => (
            <li
              key={idx}
              className={`text-sm font-mono break-all flex items-start gap-2 ${danger ? "text-red-400" : "text-emerald-300"}`}
            >
              <span className="opacity-50 mt-1">{`>`}</span>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-600 italic">{emptyText}</p>
      )}
    </div>
  );
};

export default Dashboard;
