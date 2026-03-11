import type { ReactNode } from "react";

interface LandingLayoutProps {
  children: ReactNode;
}

const LandingLayout = ({ children }: LandingLayoutProps) => (
  <div className="min-h-screen bg-[var(--bg-main)] text-white">
    <div className="mx-auto w-full max-w-[1200px] px-6">
      {children}
    </div>
  </div>
);

export default LandingLayout;
