import { useState } from "react";
import { Send, Bot } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  loading?: boolean;
}

export default function ChatInput({ onSend, loading = false }: ChatInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="copilot-input-form">
      <div className="input-box">
        <Bot size={18} className="text-cyan-400 shrink-0 ml-3" />
        <input
          type="text"
          placeholder="Ask NetPilot AI about network status or failures..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!text.trim() || loading}
          className="send-btn"
          aria-label="Send Message"
        >
          <Send size={16} />
        </button>
      </div>
    </form>
  );
}
