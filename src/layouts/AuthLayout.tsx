import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="mobile-main flex min-h-screen items-center justify-center bg-background px-4 py-12 max-sm:px-3 max-sm:py-6">
      <div className="w-full max-w-[420px]">{children}</div>
    </div>
  );
};

export default AuthLayout;
