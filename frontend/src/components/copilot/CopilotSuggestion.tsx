import { Sparkles } from "lucide-react";

interface CopilotSuggestionProps {
  suggestions: string[];
  onSelect: (text: string) => void;
}

export default function CopilotSuggestion({
  suggestions,
  onSelect,
}: CopilotSuggestionProps) {
  return (
    <div className="copilot-suggestions-row">
      {suggestions.map((text, idx) => (
        <button
          key={idx}
          type="button"
          className="copilot-chip"
          onClick={() => onSelect(text)}
        >
          <Sparkles size={12} className="text-cyan-400" />
          <span>{text}</span>
        </button>
      ))}
    </div>
  );
}
