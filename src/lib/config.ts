export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
export const API_BASE_PATH = `${API_BASE_URL}/api`;

export const WS_BASE_URL = import.meta.env.VITE_WS_URL || API_BASE_URL;
export const WS_URL = WS_BASE_URL.replace(/^http/, "ws") + "/ws";
