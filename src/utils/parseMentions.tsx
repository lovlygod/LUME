import type { ReactNode } from "react";
import { Mention } from "@/components/common/Mention";

const mentionRegex = /(@[a-zA-Z0-9_]+)/g;

export const parseMentions = (text: string): ReactNode[] => {
  const parts = text.split(mentionRegex);

  return parts.map((part, index) => {
    if (part.startsWith("@")) {
      const username = part.slice(1);
      return <Mention key={`mention-${index}`} username={username} />;
    }

    return <span key={`text-${index}`}>{part}</span>;
  });
};
