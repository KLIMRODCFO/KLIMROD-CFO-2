"use client";
import { useRef, useState, useEffect } from "react";
import { useActiveBU } from "../ActiveBUContext";

function MessageBubble({ message, isUser }: { message: string; isUser: boolean }) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black flex items-center justify-center mr-2">
          <span className="text-white text-lg font-bold">K</span>
        </div>
      )}
      <div className={`max-w-[70%] px-5 py-3 rounded-2xl shadow-lg text-base font-medium ${isUser
        ? 'bg-gradient-to-br from-gray-900 to-gray-700 text-white rounded-br-none'
        : 'bg-gradient-to-br from-white to-gray-100 text-gray-900 rounded-bl-none border border-gray-200'}
        animate-fade-in`}
        style={{ wordBreak: 'break-word', whiteSpace: 'pre-line' }}
      >
        {message}
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-lg ml-3">
          <span className="text-white text-xl font-bold">🧑‍💼</span>
        </div>
      )}
    </div>
  );
}

export default function ChatKlimrodAIPage() {
  const { activeBU } = useActiveBU();
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>(
    [{ role: 'ai', content: 'Hello! I am KLIMROD AI, your financial assistant. How can I help you today?' }]
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user' as const, content: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, business_unit_id: activeBU }),
      });
      const data = await res.json();
      setMessages((msgs) => [...msgs, { role: 'ai', content: data.reply || 'Error: No response from AI.' }]);
    } catch {
      setMessages((msgs) => [...msgs, { role: 'ai', content: 'Error: Unable to connect to Klimrod AI.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl flex flex-col h-[80vh] border-x border-[#e5e5e5] bg-white">
        <div className="flex items-center px-6 py-4 border-b border-[#e5e5e5] bg-white">
          <span className="text-lg font-bold text-black tracking-widest">CHAT KLIMROD AI</span>
        </div>
        <div ref={chatRef} className="flex-1 overflow-y-auto px-6 py-6 bg-white" style={{scrollBehavior:'smooth'}}>
          {messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg.content} isUser={msg.role === 'user'} />
          ))}
          {loading && (
            <div className="w-full flex justify-start mb-2 animate-pulse">
              <div className="max-w-2xl w-fit px-4 py-2 rounded-lg bg-[#f7f7f8] text-black border border-[#e5e5e5]">
                Klimrod AI is typing...
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 bg-white border-t border-[#e5e5e5] flex items-center gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-2 rounded-lg border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-black text-base bg-white text-black"
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            autoFocus
            style={{ fontFamily: 'Inter, sans-serif' }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-4 py-2 rounded-lg bg-black text-white font-semibold hover:bg-gray-900 transition-all text-base disabled:opacity-50"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
