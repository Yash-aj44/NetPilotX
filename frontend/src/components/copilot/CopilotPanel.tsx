import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bot, Zap, RefreshCw } from "lucide-react";
import { useNetwork } from "../../context/NetworkContext";
import { askCopilot } from "../../services/ai";
import ChatMessage, { type MessageItem } from "./ChatMessage";
import ChatInput from "./ChatInput";
import CopilotSuggestion from "./CopilotSuggestion";
import { useNavigate } from "react-router-dom";

interface CopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNodeId?: string | null;
}

export default function CopilotPanel({
  isOpen,
  onClose,
  selectedNodeId,
}: CopilotPanelProps) {
  const navigate = useNavigate();
  const { failureAlert, recoverNetwork, refreshNetwork } =
    useNetwork();

  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "init-1",
      sender: "ai",
      text: "Hello, I am NetPilot X AI Assistant. I am continuously monitoring your network infrastructure. How can I assist you with NOC operations today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [contextChanged, setContextChanged] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Trigger Context Updated indicator whenever failure or node selection changes
  useEffect(() => {
    setContextChanged(true);
    const timer = setTimeout(() => setContextChanged(false), 2500);
    return () => clearTimeout(timer);
  }, [failureAlert, selectedNodeId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (text: string) => {
    const userMsg: MessageItem = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await askCopilot(text, failureAlert);

      const aiMsg: MessageItem = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: response.answer,
        actions: response.suggestedActions,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      const aiMsg: MessageItem = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: "NetPilot AI is temporarily unavailable. Check the backend connection and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = (
    actionType: "recover" | "inspect" | "refresh",
    targetId?: string
  ) => {
    if (actionType === "recover") {
      recoverNetwork();
    } else if (actionType === "refresh") {
      refreshNetwork();
    } else if (actionType === "inspect") {
      navigate(`/network?device=${targetId || ""}`);
    }
  };

  const suggestions = failureAlert
    ? [`Why is ${failureAlert.deviceName} offline?`, "How to recover failure?", "Show network status"]
    : ["Show network status", "Check telemetry metrics", "Is infrastructure healthy?"];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.aside
        className="copilot-drawer-panel"
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
      >
        {/* Header */}
        <div className="copilot-panel-header">
          <div className="copilot-title-box">
            <div className="copilot-avatar">
              <Bot size={20} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2>NetPilot AI Copilot</h2>
                <span className="live-status-tag">
                  <Zap size={10} /> ONLINE
                </span>
              </div>
              <p className="copilot-subtitle">Intelligent NOC Operations Assistant</p>
            </div>
          </div>

          <button
            type="button"
            className="panel-close-btn"
            onClick={onClose}
            aria-label="Close Copilot"
          >
            <X size={18} />
          </button>
        </div>

        {/* Context Updated Indicator Bar */}
        {contextChanged && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="context-updated-bar"
          >
            <RefreshCw size={12} style={{ color: "var(--accent)" }} className="animate-spin" />
            <span>CONTEXT UPDATED WITH LATEST TELEMETRY</span>
          </motion.div>
        )}

        {/* Chat Messages */}
        <div className="copilot-messages-container">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onExecuteAction={handleExecuteAction}
            />
          ))}

          {loading && (
            <div className="copilot-typing-indicator">
              <Bot size={16} style={{ color: "var(--accent)" }} className="animate-pulse" />
              <span>Analyzing network context...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer Prompt Suggestions & Input */}
        <div className="copilot-panel-footer">
          <CopilotSuggestion
            suggestions={suggestions}
            onSelect={handleSendMessage}
          />
          <ChatInput onSend={handleSendMessage} loading={loading} />
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
