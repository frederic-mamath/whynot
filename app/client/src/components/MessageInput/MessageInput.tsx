import { useState } from "react";
import { useTranslation } from "react-i18next";
import Input from "../ui/Input/Input";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        value={message}
        onChange={(v) => setMessage(v)}
        onKeyDown={handleKeyDown}
        placeholder={t("messages.placeholder")}
        maxLength={500}
        disabled={disabled}
        borderClassName="flex-1 bg-white/10 border-white/20"
        inputClassName="text-white placeholder:text-white/50"
      />
      <button
        type="submit"
        disabled={!message.trim() || disabled}
        className="size-10 rounded-md flex items-center justify-center bg-primary text-primary-foreground disabled:opacity-50 shrink-0"
      >
        <Send className="size-4" />
      </button>
    </form>
  );
}
