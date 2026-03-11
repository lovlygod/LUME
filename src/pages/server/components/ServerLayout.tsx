import SidebarLeft from "@/components/layout/SidebarLeft";
import type { Channel, Server } from "@/types";
import { ServerSidebar } from "./ServerSidebar";

interface ServerLayoutProps {
  server: Server | null;
  currentChannelId: number | null;
  onSelectChannel: (channel: Channel) => void;
  children: React.ReactNode;
}

export const ServerLayout = ({ server, currentChannelId, onSelectChannel, children }: ServerLayoutProps) => {
  return (
    <div className="flex h-screen w-full gap-0.1 overflow-hidden bg-background">
      <SidebarLeft />
      <ServerSidebar server={server} currentChannelId={currentChannelId} onSelectChannel={onSelectChannel} />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
};
