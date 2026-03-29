import { sanitizePlainText } from "./sanitize";
import { parseMentions } from "@/utils/parseMentions";

const linkRegex = /(https?:\/\/[^\s]+)/g;
const bareLinkRegex = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,})(?:\/[^\s]*)?/gi;
const commandRegex = /\/(\S+)/g;

const isBareLink = (value: string) => {
  if (!value) return false;
  bareLinkRegex.lastIndex = 0;
  if (value.startsWith("http://") || value.startsWith("https://")) return false;
  if (value.includes("@")) return false;
  return bareLinkRegex.test(value);
};

export const renderSafeTextWithLinks = (
  text: string,
  options?: { onCommand?: (command: string) => void }
) => {
  const sanitized = sanitizePlainText(text);
  const parts = sanitized.split(linkRegex);
  return parts.map((part, index) => {
    const isLink = part.startsWith("http://") || part.startsWith("https://");
    if (isLink) {
      return (
        <span key={`link-${index}`} className="inline">
          <a
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/85 underline decoration-white/30 hover:decoration-white/60"
          >
            {part}
          </a>
        </span>
      );
    }

    if (isBareLink(part)) {
      const safeHref = `https://${part}`;
      return (
        <span key={`link-${index}`} className="inline">
          <a
            href={safeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/85 underline decoration-white/30 hover:decoration-white/60"
          >
            {part}
          </a>
        </span>
      );
    }

    const commandMatches = [...part.matchAll(commandRegex)];
    if (commandMatches.length > 0) {
      const elements: React.ReactNode[] = [];
      let lastIndex = 0;
      commandMatches.forEach((match, cmdIndex) => {
        const matchIndex = match.index ?? 0;
        const rawCommand = match[0];
        if (matchIndex > lastIndex) {
          elements.push(
            <span key={`command-text-${index}-${cmdIndex}`}>
              {parseMentions(part.slice(lastIndex, matchIndex))}
            </span>
          );
        }
        elements.push(
          <button
            key={`command-${index}-${cmdIndex}`}
            type="button"
            className="text-blue-300 hover:text-blue-200 underline decoration-blue-300/40"
            onClick={() => options?.onCommand?.(rawCommand)}
          >
            {rawCommand}
          </button>
        );
        lastIndex = matchIndex + rawCommand.length;
      });
      if (lastIndex < part.length) {
        elements.push(
          <span key={`command-tail-${index}`}>
            {parseMentions(part.slice(lastIndex))}
          </span>
        );
      }
      return <span key={`command-wrap-${index}`}>{elements}</span>;
    }

    return <span key={`text-${index}`}>{parseMentions(part)}</span>;
  });
};
