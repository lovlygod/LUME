const isDevelopment = import.meta.env.DEV;
const defaultApiBaseUrl = isDevelopment ? "http://localhost:5000" : "";

export const API_BASE_URL = import.meta.env.VITE_API_URL || defaultApiBaseUrl;
export const API_BASE_PATH = `${API_BASE_URL}/api`;

const defaultWsBaseUrl = API_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "");

export const WS_BASE_URL = import.meta.env.VITE_WS_URL || defaultWsBaseUrl;
export const WS_URL = WS_BASE_URL.replace(/^http/, "ws") + "/ws";

export const E2EE_ENABLED = String(import.meta.env.VITE_E2EE_ENABLED || "false").toLowerCase() === "true";
export const E2EE_STRICT_MODE = String(import.meta.env.VITE_E2EE_STRICT_MODE || "false").toLowerCase() === "true";
