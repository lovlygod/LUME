import React from 'react';
import SidebarLeft from '@/components/layout/SidebarLeft';
import { ServerSidebar } from './ServerSidebar';

interface ServerLayoutProps {
  children: React.ReactNode;
}

export const ServerLayout: React.FC<ServerLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen w-full gap-0.1 overflow-hidden bg-background">
      {/* Left Sidebar - стандартный левый сайдбар LUME */}
      <SidebarLeft />

      {/* Server Sidebar - каналы сервера (вместо правого сайдбара) */}
      <ServerSidebar />

      {/* Main Content - сообщения канала */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
};
