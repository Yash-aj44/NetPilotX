import { Bot, User as UserIcon, Zap } from "lucide-react";

export interface MessageItem {
  id: string;
  sender: "user" | "ai";
  text: string;
  actions?: { label: string; actionType: "recover" | "inspect" | "refresh"; targetId?: string }[];
  timestamp: string;
}

interface ChatMessageProps {
  message: MessageItem;
  onExecuteAction?: (actionType: "recover" | "inspect" | "refresh", targetId?: string) => void;
}

export default function ChatMessage({ message, onExecuteAction }: ChatMessageProps) {
  const isUser = message.sender === "user";

  return (
    <div className={`chat-message-item ${isUser ? "user-msg" : "ai-msg"}`}>
      <div className="msg-avatar">
        {isUser ? (
          <UserIcon size={16} className="text-emerald-400" />
        ) : (
          <Bot size={16} className="text-cyan-400" />
        )}
      </div>

      <div className="msg-body">
        <div className="msg-header">
          <strong>{isUser ? "You" : "NetPilot AI"}</strong>
          <span className="msg-time">{message.timestamp}</span>
        </div>

        <div className="msg-text-content">
          {message.text.split("\n").map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </div>

        {message.actions && message.actions.length > 0 && (
          <div className="msg-actions-row">
            {message.actions.map((act, idx) => (
              <button
                key={idx}
                type="button"
                className="action-pill-btn"
                onClick={() => onExecuteAction && onExecuteAction(act.actionType, act.targetId)}
              >
                <Zap size={12} className="text-cyan-400" />
                <span>{act.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
