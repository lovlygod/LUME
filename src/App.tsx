import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import AppearancePage from "./pages/settings/AppearancePage";
import PrivacyPage from "./pages/settings/PrivacyPage";
import ChatPage from "./pages/settings/ChatPage";
import LanguagePage from "./pages/settings/LanguagePage";
import DangerPage from "./pages/settings/DangerPage";
import SessionsPage from "./pages/settings/SessionsPage";
import NotFound from "./pages/NotFound";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import OnboardingPage from "./pages/onboarding/OnboardingPage";
import WorkspacesPage from "./pages/workspaces/WorkspacesPage";
import WorkspaceDetailPage from "./pages/workspaces/WorkspaceDetailPage";
import ProjectsPage from "./pages/projects/ProjectsPage";
import ProjectDetailPage from "./pages/projects/ProjectDetailPage";
import AddStickerPackPage from "./pages/stickers/AddStickerPackPage";
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
        <Route element={<MainLayout />}>
          <Route path="/feed" element={<Index />} />
          <Route path="/home" element={<Index />} />
          <Route path="/workspaces" element={<WorkspacesPage />} />
          <Route path="/workspaces/:slug" element={<WorkspaceDetailPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:slug" element={<Navigate to="overview" replace />} />
          <Route path="/projects/:slug/:tab" element={<ProjectDetailPage />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:chatId" element={<Messages />} />
          <Route path="/messages/:chatId/:rest" element={<Messages />} />
          <Route path="/invite/:token" element={<Messages />} />
          <Route path="/addstickers/:packSlug" element={<AddStickerPackPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<UserProfile />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/verified" element={<Verified />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/appearance" element={<AppearancePage />} />
          <Route path="/settings/privacy" element={<PrivacyPage />} />
          <Route path="/settings/chat" element={<ChatPage />} />
          <Route path="/settings/language" element={<LanguagePage />} />
          <Route path="/settings/danger" element={<DangerPage />} />
          <Route path="/settings/sessions" element={<SessionsPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
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
