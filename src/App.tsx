import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useTheme } from "./hooks/useTheme";
import CookieBanner from "@/components/ui/CookieBanner";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Verified from "./pages/Verified";
import AdminPanel from "./pages/AdminPanel";
import Settings from "./pages/Settings";
import SessionsPage from "./pages/settings/SessionsPage";
import NotFound from "./pages/NotFound";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import ServerPage from "./pages/server/ServerPage";
import ServersPage from "./pages/ServersPage";
import ServerSettingsPage from "./pages/ServerSettingsPage";
import ServerMembersPage from "./pages/ServerMembersPage";
import LandingLayout from "@/layouts/LandingLayout";
import LandingPage from "@/pages/LandingPage";
import FAQPage from "@/pages/FAQPage";
import RulesPage from "@/pages/RulesPage";
import SupportPage from "@/pages/SupportPage";
import StatusPage from "@/pages/StatusPage";
import ContactsPage from "@/pages/ContactsPage";
import CookiePolicy from "@/pages/CookiePolicy";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import GuestRoute from "@/components/auth/GuestRoute";
import MainLayout from "@/layouts/MainLayout";

const AppContent = () => {
  useTheme(); // Initialize theme

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingLayout>
            <LandingPage />
          </LandingLayout>
        }
      />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/rules" element={<RulesPage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="/status" element={<StatusPage />} />
      <Route path="/contacts" element={<ContactsPage />} />
      <Route element={<MainLayout />}>
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
      </Route>

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        {/* Server routes - левый сайдбар остается, правый убирается */}
        <Route path="/server/:identifier/channel/:channelName" element={<ServerPage />} />
        <Route path="/server/:identifier/settings" element={<ServerSettingsPage />} />
        <Route path="/server/:identifier/members" element={<ServerMembersPage />} />
        <Route path="/server/:identifier" element={<ServerPage />} />

        <Route element={<MainLayout />}>
          <Route path="/feed" element={<Index />} />
          <Route path="/servers" element={<ServersPage />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:chatId" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<UserProfile />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/verified" element={<Verified />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/sessions" element={<SessionsPage />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
      <CookieBanner />
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
