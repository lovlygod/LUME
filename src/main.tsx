import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { ServerProvider } from "./contexts/ServerContext.tsx";
import { QueryProvider } from "./lib/queryClient.tsx";
import { LanguageProvider } from "./contexts/LanguageContext";

createRoot(document.getElementById("root")!).render(
  <QueryProvider>
    <AuthProvider>
      <LanguageProvider>
        <ServerProvider>
          <App />
        </ServerProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryProvider>
);
