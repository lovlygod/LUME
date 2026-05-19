const npmCommandRegex = /^npm\s+([@a-z0-9-/]+)/i;

export function detectNpmCommand(text: string): string | null {
  if (!text || typeof text !== "string") return null;

  const trimmed = text.trim();
  if (!trimmed.startsWith("npm ")) return null;

  const match = trimmed.match(npmCommandRegex);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

export function isNpmCommand(text: string): boolean {
  return detectNpmCommand(text) !== null;
}