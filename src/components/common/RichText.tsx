import { parseMentions } from "@/utils/parseMentions";

export function RichText({ text }: { text: string }) {
  return <>{parseMentions(text)}</>;
}
