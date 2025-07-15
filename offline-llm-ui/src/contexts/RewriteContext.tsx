import { createContext, useContext, useState, type ReactNode } from "react";
import { redraftText } from "../api";

interface Message {
  from: "user" | "assistant";
  text: string;
}

interface RewriteContextValue {
  messages: Message[];
  sendMessage: (text: string) => Promise<void>;
  sending: boolean;
  error: string | null;
}

const RewriteContext = createContext<RewriteContextValue | undefined>(undefined);

export function RewriteProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage(text: string) {
    setMessages((m) => [...m, { from: "user", text }]);
    setSending(true);
    setError(null);
    try {
      const { corrected } = await redraftText(text);
      setMessages((m) => [...m, { from: "assistant", text: corrected }]);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <RewriteContext.Provider value={{ messages, sendMessage, sending, error }}>
      {children}
    </RewriteContext.Provider>
  );
}

export function useRewrite() {
  const ctx = useContext(RewriteContext);
  if (!ctx) throw new Error("useRewrite must be inside RewriteProvider");
  return ctx;
}
