import { useState, KeyboardEvent } from "react";
import { Input } from "../ui/input";
import Button from "../ui/button";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type a message..."
        maxLength={500}
        disabled={disabled}
        className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20"
      />
      <Button
        type="submit"
        disabled={!message.trim() || disabled}
        size="icon"
        variant="default"
      >
        <Send className="w-4 h-4" />
      </Button>
    </form>
  );
}
