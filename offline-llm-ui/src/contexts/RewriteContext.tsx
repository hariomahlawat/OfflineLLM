import { createContext, useContext, useState, type ReactNode } from "react";
import { grammarCheck } from "../api";

interface Message {
  from: "user" | "assistant";
  text: string;
}

interface RewriteContextValue {
  messages: Message[];
  sendMessage: (text: string) => Promise<void>;
  sending: boolean;
}

const RewriteContext = createContext<RewriteContextValue | undefined>(undefined);

export function RewriteProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);

  async function sendMessage(text: string) {
    setMessages((m) => [...m, { from: "user", text }]);
    setSending(true);
    try {
      const { corrected } = await grammarCheck(text);
      setMessages((m) => [...m, { from: "assistant", text: corrected }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <RewriteContext.Provider value={{ messages, sendMessage, sending }}>
      {children}
    </RewriteContext.Provider>
  );
}

export function useRewrite() {
  const ctx = useContext(RewriteContext);
  if (!ctx) throw new Error("useRewrite must be inside RewriteProvider");
  return ctx;
}
