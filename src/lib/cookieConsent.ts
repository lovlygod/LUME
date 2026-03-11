export type CookieConsent = "accepted" | "declined" | null;

export function getCookieConsent(): CookieConsent {
  return (localStorage.getItem("cookie-consent") as CookieConsent) || null;
}

export function setCookieConsent(value: "accepted" | "declined") {
  localStorage.setItem("cookie-consent", value);
}

export function resetCookieConsent() {
  localStorage.removeItem("cookie-consent");
}
