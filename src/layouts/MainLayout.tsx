import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import SidebarLeft from "@/components/layout/SidebarLeft";
import SidebarRight from "@/components/layout/SidebarRight";

const MainLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isPolicyPage =
    pathname === "/privacy-policy" ||
    pathname === "/terms-of-service" ||
    pathname === "/cookie-policy";
  const hideRightSidebar = pathname.startsWith("/messages") || pathname.startsWith("/invite");

  return (
    <AppLayout>
      <div className="flex h-screen w-full overflow-hidden min-h-0 pb-24 lg:pb-0">
        {/* Left Sidebar - 260px fixed */}
        {!isPolicyPage && <SidebarLeft />}

        {/* Main Content - scrollable area */}
        <main
          className={`flex-1 overflow-y-auto min-h-0 ${
            isPolicyPage ? "px-6" : "px-9"
          } ${hideRightSidebar ? "max-w-none" : "max-w-[640px]"} ${
            isPolicyPage ? "mx-auto w-full max-w-[720px]" : ""
          }`}
        >
          {isPolicyPage && (
            <div className="mt-6 mb-6">
              <button
                type="button"
                onClick={() => navigate("/feed")}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                ← Back to feed
              </button>
            </div>
          )}
          <Outlet />
        </main>

        {/* Right Sidebar - 340px fixed */}
        {!hideRightSidebar && !isPolicyPage && <SidebarRight />}
      </div>
    </AppLayout>
  );
};

export default MainLayout;
