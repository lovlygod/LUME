import React from 'react';
import { useServer } from '@/contexts/ServerContext';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Hash, Plus, Settings, Users, LogOut, DoorOpen, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiRequest } from '@/services/api';
import { errorHandler } from '@/services/errorHandler';

interface ServerSidebarProps {
  onChannelSelect?: (channelId: number, channelName: string) => void;
}

export const ServerSidebar: React.FC<ServerSidebarProps> = ({ onChannelSelect }) => {
  const { currentServer, currentChannel, fetchServerChannels, leaveServer, joinRequests, approveJoinRequest, rejectJoinRequest, fetchJoinRequests } = useServer();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [channels, setChannels] = useState<Array<{ id: number; name: string; type: string; position: number }>>([]);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  const [contextMenu, setContextMenu] = useState<{channelId: number; channelName: string; x: number; y: number} | null>(null);
  const [channelToDelete, setChannelToDelete] = useState<{id: number; name: string} | null>(null);

  const userId = user?.id ? parseInt(user.id) : parseInt(localStorage.getItem('userId') || '0');
  const isOwner = currentServer && userId && Number(currentServer.ownerId) === userId;
  const isAdmin = currentServer?.role && currentServer.role.rank >= 80;
  const canManageChannels = isOwner || isAdmin;

  React.useEffect(() => {
    if (currentServer?.id) {
      fetchServerChannels(currentServer.id).then(setChannels);
      if (isOwner) {
        fetchJoinRequests(currentServer.id);
      }
    }
  }, [currentServer?.id]);

  const handleChannelClick = (channel: { id: number; name: string }) => {
    onChannelSelect?.(channel.id, channel.name);
    navigate(`/server/${currentServer?.username || currentServer?.id}/channel/${channel.name}`);
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim() || !currentServer) return;

    try {
      const data = await apiRequest<{ channel: { id: number; name: string; type: string; position: number } }>(
        `/servers/${currentServer.id}/channels`,
        {
          method: "POST",
          body: JSON.stringify({ name: newChannelName.trim() }),
        }
      );

      setChannels(prev => [...prev, data.channel]);
      setNewChannelName('');
      setIsCreatingChannel(false);
      toast.success(t('servers.channelCreated'));
    } catch (error) {
      errorHandler.handleApiError(error, { showToast: true });
      toast.error(t('servers.channelCreateError'));
    }
  };

  const handleDeleteChannel = async () => {
    if (!channelToDelete || !currentServer) return;

    try {
      await apiRequest(`/servers/${currentServer.id}/channels/${channelToDelete.id}`, {
        method: "DELETE",
      });

      toast.success(t('servers.channelDeleted'));
      setChannels(prev => prev.filter(c => c.id !== channelToDelete.id));
      setChannelToDelete(null);
      setContextMenu(null);
      
      // If deleted channel was current, navigate to another channel
      if (currentChannel?.id === channelToDelete.id && channels.length > 1) {
        const otherChannel = channels.find(c => c.id !== channelToDelete.id);
        if (otherChannel) {
          navigate(`/server/${currentServer.username || currentServer.id}/channel/${otherChannel.name}`);
        }
      }
    } catch (error) {
      errorHandler.handleApiError(error, { showToast: true });
      toast.error(t('servers.channelDeleteError'));
    }
  };

  const handleLeaveServer = async () => {
    if (!currentServer) return;
    await leaveServer(currentServer.id);
    navigate('/feed');
  };

  const handleApproveRequest = async (requestId: number) => {
    if (!currentServer) return;
    await approveJoinRequest(currentServer.id, requestId);
  };

  const handleRejectRequest = async (requestId: number) => {
    if (!currentServer) return;
    await rejectJoinRequest(currentServer.id, requestId);
  };

  const handleContextMenu = (e: React.MouseEvent, channel: { id: number; name: string }) => {
    e.preventDefault();
    if (canManageChannels) {
      setContextMenu({
        channelId: channel.id,
        channelName: channel.name,
        x: e.clientX,
        y: e.clientY,
      });
    }
  };

  if (!currentServer) return null;

  return (
    <div className="w-72 h-full p-4">
      <div className="flex h-full flex-col overflow-hidden rounded-[30px] border border-white/10 bg-white/5 backdrop-blur-[24px]">
        {/* Server Header */}
        <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          {currentServer.iconUrl ? (
            <img
              src={currentServer.iconUrl}
              alt={currentServer.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold">
              {currentServer.name[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm text-white truncate">{currentServer.name}</h2>
            <p className="text-xs text-secondary">
              {currentServer.type === 'public' && currentServer.username ? `@${currentServer.username}` : t('servers.private')}
            </p>
          </div>
        </div>
      </div>

        {/* Channels */}
        <ScrollArea className="flex-1 px-3 py-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-xs font-semibold text-secondary uppercase">{t('servers.channels')}</span>
            {canManageChannels && (
              <Dialog open={isCreatingChannel} onOpenChange={setIsCreatingChannel}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-white/60">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('servers.createChannel')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Input
                      placeholder={t('servers.channelNamePlaceholder')}
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateChannel()}
                    />
                    <Button onClick={handleCreateChannel} className="w-full">
                      {t('servers.createChannel')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => handleChannelClick(channel)}
              onContextMenu={(e) => handleContextMenu(e, channel)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-full text-sm transition-smooth group ${
                currentChannel?.id === channel.id
                  ? 'text-white'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Hash className="h-4 w-4" />
              <span className="truncate flex-1 text-left">{channel.name}</span>
              {canManageChannels && (
                <Trash2 
                  className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-red-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    setChannelToDelete({ id: channel.id, name: channel.name });
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Join Requests for Owner */}
        {isOwner && joinRequests.length > 0 && (
          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-xs font-semibold text-secondary uppercase flex items-center gap-1">
                <DoorOpen className="h-3 w-3" />
                {t('servers.requests')} ({joinRequests.length})
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowJoinRequests(!showJoinRequests)}
                className="h-6 text-xs text-white/70"
              >
                {showJoinRequests ? t('servers.hideRequests') : t('servers.showRequests')}
              </Button>
            </div>

            {showJoinRequests && (
              <div className="mt-2 space-y-2">
                {joinRequests.map((request) => (
                  <div key={request.id} className="p-2 bg-white/5 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={request.avatar || '/default-avatar.png'}
                        alt={request.username}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm font-medium text-white truncate">{request.username}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1 h-7 text-xs"
                        onClick={() => handleApproveRequest(request.id)}
                      >
                        {t('servers.accept')}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 h-7 text-xs"
                        onClick={() => handleRejectRequest(request.id)}
                      >
                        {t('servers.reject')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </ScrollArea>

        {/* Server Actions */}
        <div className="px-5 py-4 border-t border-white/10 space-y-2">
        {currentServer.isMember && !isOwner && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={handleLeaveServer}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t('servers.leave')}
          </Button>
        )}

        {isOwner && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => navigate(`/server/${currentServer.id}/settings`)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {t('servers.settings')}
          </Button>
        )}

        {(isOwner || isAdmin) && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => navigate(`/server/${currentServer.id}/members`)}
          >
            <Users className="h-4 w-4 mr-2" />
            {t('servers.members')}
          </Button>
        )}
      </div>

        {/* Context Menu */}
        <AnimatePresence>
          {contextMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setContextMenu(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed z-50 glass-panel rounded-2xl p-1"
                style={{
                  left: Math.min(contextMenu.x, window.innerWidth - 150),
                  top: Math.min(contextMenu.y, window.innerHeight - 50),
                }}
              >
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start text-red-200 hover:text-red-200 hover:bg-white/5"
                    onClick={() => {
                      setChannelToDelete({ id: contextMenu.channelId, name: contextMenu.channelName });
                      setContextMenu(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('servers.deleteChannel')}
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Delete Channel Confirmation */}
        <AlertDialog open={!!channelToDelete} onOpenChange={(open) => {
          if (!open) setChannelToDelete(null);
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('servers.deleteChannel')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('servers.deleteChannelConfirm', { channel: `#${channelToDelete?.name || ''}` })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteChannel}>
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
