import React, { useRef, useEffect, useState } from 'react';
import { Send, User, Bot, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ChatMessage, InternalLogicState } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  internalState: InternalLogicState | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading, internalState }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
            <User className="w-6 h-6 text-slate-300" />
          </div>
          <div>
            <h2 className="font-semibold">Unknown Caller</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              {isLoading ? 'Typing...' : 'Online'}
            </p>
          </div>
        </div>
        
        {/* Scam Indicator for the user (Demo purposes only) */}
        {internalState?.scamDetected ? (
           <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-mono border border-red-500/50">
             <AlertTriangle className="w-3 h-3" />
             <span>SCAM DETECTED</span>
           </div>
        ) : (
          <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-mono border border-green-500/50">
             <ShieldCheck className="w-3 h-3" />
             <span>SAFE</span>
           </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#e5ddd5] space-y-4">
        <div className="text-center text-xs text-gray-500 my-4">
          <span className="bg-[#e5ddd5] px-2 py-1 rounded-lg border border-gray-300 shadow-sm">
            Messages are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
          </span>
        </div>

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 shadow-sm relative ${
                msg.sender === 'user'
                  ? 'bg-white text-gray-900 rounded-tl-none'
                  : 'bg-[#d9fdd3] text-gray-900 rounded-tr-none'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              <span className="text-[10px] text-gray-500 block text-right mt-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-end">
             <div className="bg-[#d9fdd3] text-gray-500 rounded-lg p-3 shadow-sm rounded-tr-none text-xs italic">
                Agent is thinking...
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-gray-100 border-t border-gray-200 shrink-0">
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-300">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message as the scammer..."
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-gray-400"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputText.trim()}
            className={`p-2 rounded-full transition-colors ${
              isLoading || !inputText.trim() 
                ? 'text-gray-400' 
                : 'text-[#00a884] hover:bg-gray-100'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-2">
           You are roleplaying as the SCAMMER. The AI is the VICTIM.
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;