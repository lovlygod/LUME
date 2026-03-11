import { sanitizePlainText } from "./sanitize";

const linkRegex = /(https?:\/\/[^\s]+)/g;

export const renderSafeTextWithLinks = (text: string) => {
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

    return <span key={`text-${index}`}>{part}</span>;
  });
};
