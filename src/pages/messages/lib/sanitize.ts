import DOMPurify from "dompurify";

export const sanitizePlainText = (text: string) =>
  DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
