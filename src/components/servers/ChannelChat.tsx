import React, { useState, useEffect, useRef } from 'react';
import { useServer } from '@/contexts/ServerContext';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Image as ImageIcon, File, Trash2, X, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiRequest } from '@/services/api';
import { errorHandler } from '@/services/errorHandler';
import { ImageThumb, ImageViewer } from '@/components/media/ImageViewer';
import { ReplyBar } from '@/components/chat/ReplyBar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface ReplyPreview {
  id: string;
  author: string;
  text?: string;
  imageUrl?: string;
}

const renderTextWithLinks = (text: string) => {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, index) => {
    if (part.startsWith('http://') || part.startsWith('https://')) {
      return (
        <a
          key={`link-${index}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/85 underline decoration-white/30 hover:decoration-white/60"
        >
          {part}
        </a>
      );
    }

    return <span key={`text-${index}`}>{part}</span>;
  });
};

export const ChannelChat: React.FC<{ serverId: number; channelId: number; channelName: string }> = ({
  serverId,
  channelId,
  channelName,
}) => {
  const { fetchChannelMessages, sendMessage, currentServer } = useServer();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Array<{
    id: string;
    userId: string;
    text: string;
    createdAt: string;
    author: {
      id: string;
      name: string;
      username: string;
      avatar: string;
      verified: boolean;
    };
    attachments: Array<{
      id: string;
      type: 'image' | 'file';
      url: string;
      mime: string;
      size: number;
      width?: number;
      height?: number;
    }>;
    deletedForMe?: boolean;
    deletedForAll?: boolean;
    replyToMessageId?: string | null;
  }>>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [attachments, setAttachments] = useState<Array<{
    id: string;
    type: 'image' | 'file';
    url: string;
    mime: string;
    size: number;
  }>>([]);
  const [replyTo, setReplyTo] = useState<ReplyPreview | null>(null);
  const [showDeleteMenu, setShowDeleteMenu] = useState<{msgId: string; x: number; y: number} | null>(null);
  const [deleteScope, setDeleteScope] = useState<'me' | 'all' | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [activeImageSrc, setActiveImageSrc] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, [channelId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<{
        messages: Array<{
          id: string;
          userId: string;
          text: string;
          createdAt: string;
          author: {
            id: string;
            name: string;
            username: string;
            avatar: string;
            verified: boolean;
          };
          attachments: Array<{
            id: string;
            type: 'image' | 'file';
            url: string;
            mime: string;
            size: number;
            width?: number;
            height?: number;
          }>;
          deleted_for_me?: boolean;
          deleted_for_all?: boolean;
          replyToMessageId?: string | null;
        }>;
      }>(`/servers/${serverId}/channels/${channelId}/messages`, {
        method: "GET",
      });

      // Map messages to include deletedForMe status
       const messagesWithDeleteStatus = data.messages.map((msg) => ({
         ...msg,
         deletedForMe: msg.deleted_for_me === true,
         deletedForAll: msg.deleted_for_all === true,
         replyToMessageId: msg.replyToMessageId || null,
       }));
setMessages(messagesWithDeleteStatus);
    } catch (error) {
      errorHandler.handleApiError(error, { showToast: true });
      toast.error(error instanceof Error ? error.message : t('servers.loadingMessagesError'));
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } else if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`http://localhost:5000/api/servers/uploads`, {
        method: "POST",
        body: formData,
        credentials: 'include',
        headers: {
          ...(document.cookie.includes('csrfToken=') ? { 'X-CSRF-Token': (document.cookie.split('csrfToken=')[1] || '').split(';')[0] } : {}),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || errorData.error || 'Upload failed');
      }

      const uploaded = await response.json() as {
        attachmentId: string;
        type: 'image' | 'file';
        url: string;
        mime: string;
        size: number;
      };

      setAttachments(prev => [...prev, {
        id: String(uploaded.attachmentId),
        type: uploaded.type,
        url: uploaded.url,
        mime: uploaded.mime,
        size: uploaded.size,
      }]);
      toast.success(t('servers.fileUploaded'));
    } catch (error) {
      errorHandler.handleApiError(error, { showToast: true });
      const message = error instanceof Error ? error.message : t('servers.fileUploadError');
      toast.error(message);
    }
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || isSending) return;

    setIsSending(true);
    try {
      const attachmentIds = attachments.length > 0 ? attachments.map(a => String(a.id)) : undefined;

      const data = await apiRequest<{ messageId: number }>(
        `/servers/${serverId}/channels/${channelId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({
            text: newMessage.trim() || '',
            attachmentIds: attachmentIds,
            replyToMessageId: replyTo?.id,
          }),
        }
      );
      
      // Add message to list
      setMessages(prev => [...prev, {
        id: data.messageId.toString(),
        userId: user?.id || '',
        text: newMessage.trim(),
        createdAt: new Date().toISOString(),
        author: {
          id: user?.id || '',
          name: user?.name || '',
          username: user?.username || '',
          avatar: user?.avatar || '',
          verified: user?.verified || false,
        },
        attachments: attachments,
        replyToMessageId: replyTo?.id || null,
      }]);

      setNewMessage('');
      setAttachments([]);
      clearReply();
      toast.success(t('servers.messageSent'));
    } catch (error) {
      errorHandler.handleApiError(error, { showToast: true });
      const message = error instanceof Error ? error.message : t('servers.messageSendError');
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  const [isSending, setIsSending] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      clearReply();
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, messageId: string) => {
    e.preventDefault();
    setMessageToDelete(messageId);
    setDeleteScope(null);
    setShowDeleteMenu({ msgId: messageId, x: e.clientX, y: e.clientY });
  };

  const handleDeleteConfirm = async (scope: 'me' | 'all') => {
    if (!messageToDelete) return;

    try {
      await apiRequest(`/servers/${serverId}/channels/${channelId}/messages/${messageToDelete}`, {
        method: "DELETE",
        body: JSON.stringify({ scope }),
      });

      toast.success(t('servers.messageDeleted'));

      // Update UI
      setMessages(prev => prev.filter(m => m.id !== messageToDelete));
    } catch (error) {
      errorHandler.handleApiError(error, { showToast: true });
      const message = error instanceof Error ? error.message : t('servers.messageDeleteError');
      toast.error(message);
    }

    setShowDeleteMenu(null);
    setMessageToDelete(null);
    setDeleteScope(null);
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: language === 'ru' ? ru : undefined,
      });
    } catch {
      return '';
    }
  };

  const formatClockTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const setReplyFromMessage = (msg: typeof messages[number]) => {
    const firstAttachment = msg.attachments?.find(att => att.type === 'image');
    setReplyTo({
      id: msg.id,
      author: msg.author?.name || msg.author?.username || 'User',
      text: msg.text,
      imageUrl: firstAttachment?.url,
    });
    setTimeout(() => {
      fileInputRef.current?.focus?.();
    }, 0);
  };

  const clearReply = () => setReplyTo(null);

  const handleReplyJump = (messageId: string) => {
    const target = messageRefs.current[messageId];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(messageId);
      setTimeout(() => setHighlightedMessageId(null), 1200);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const visibleMessages = messages.filter((msg) => !msg.deletedForAll && !msg.deletedForMe);

  const resolveReplyTarget = (replyId?: string | null) => {
    if (!replyId) return null;
    return messages.find(m => m.id === replyId) || null;
  };

  const isGroupedWithPrev = (index: number) => {
    if (index === 0) return false;
    const current = visibleMessages[index];
    const prev = visibleMessages[index - 1];
    if (!current || !prev) return false;
    if (current.userId !== prev.userId) return false;
    const currentTime = new Date(current.createdAt).getTime();
    const prevTime = new Date(prev.createdAt).getTime();
    return Math.abs(currentTime - prevTime) <= 3 * 60 * 1000;
  };

  return (
    <LayoutGroup>
      <div className="flex flex-col h-full p-4">
      <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-[24px]">
{/* Channel Header */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-white/50">#</span>
            <h3 className="font-semibold text-white">{channelName}</h3>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea ref={scrollRef} className="h-full px-5 py-5 md:px-8">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-secondary">
                {t('servers.loadingMessages')}
              </div>
            ) : visibleMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-secondary">
                <p className="text-sm">{t('servers.noMessages')}</p>
                <p className="text-xs mt-1">{t('servers.firstMessage')}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {visibleMessages.map((msg, index) => {
                  const grouped = isGroupedWithPrev(index);
                  const showAuthor = !grouped;
                  const replyTarget = resolveReplyTarget(msg.replyToMessageId);
                  const replyThumb = replyTarget?.attachments?.find(att => att.type === 'image')?.url;
                  return (
                    <motion.div
                      key={msg.id}
                      ref={(el) => { messageRefs.current[msg.id] = el; }}
                      className={`flex w-full gap-3 group ${msg.userId === user?.id ? 'justify-end' : 'justify-start'}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                      onDoubleClick={() => setReplyFromMessage(msg)}
                      onContextMenu={(e) => {
                        if (msg.userId === user?.id) {
                          handleDeleteClick(e, msg.id);
                        }
                      }}
                    >
                      {showAuthor ? (
                        <img
                          src={msg.author.avatar || '/default-avatar.png'}
                          alt={msg.author.username}
                          className={`w-10 h-10 rounded-full object-cover flex-shrink-0 ${msg.userId === user?.id ? 'order-2' : 'order-1'}`}
                        />
                      ) : (
                        <div className={`w-10 ${msg.userId === user?.id ? 'order-2' : 'order-1'}`} />
                      )}

                      <div className={`flex flex-col ${
                        msg.userId === user?.id ? 'items-end order-1' : 'items-start order-2'
                      } ${highlightedMessageId === msg.id ? 'ring-1 ring-white/30 rounded-[20px] shadow-[0_0_0_1px_rgba(255,255,255,0.12)]' : ''}`}>
                        {showAuthor && (
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-medium text-sm text-white">{msg.author.username}</span>
                            <span className="text-xs text-white/45">
                              {formatTime(msg.createdAt)}
                            </span>
                          </div>
                        )}

                        <div
                          className={`relative w-fit max-w-[min(560px,65%)] rounded-[20px] border border-white/10 bg-white/5 ${
                            highlightedMessageId === msg.id ? 'ring-1 ring-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]' : ''
                          } ${msg.attachments && msg.attachments.some(a => a.type === 'image') ? 'p-1 pb-1' : 'px-3 py-1.5'}`}
                        >
                          {replyTarget && (
                            <button
                              type="button"
                              onClick={() => handleReplyJump(replyTarget.id)}
                              className="mb-2 flex items-center gap-2 rounded-[16px] bg-white/[0.035] px-3 py-1.5 transition-smooth hover:bg-white/[0.06] min-w-0 max-w-full"
                            >
                              <div className="h-8 w-[3px] flex-shrink-0 rounded-full bg-white/20" />
                              {replyThumb && (
                                <img src={replyThumb} alt="reply" className="h-8 w-8 flex-shrink-0 rounded-[10px] object-cover" />
                              )}
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <div className="text-[10px] tracking-[0.18em] uppercase text-white/45">Ответ</div>
                                <div className="text-[13px] font-semibold text-white/80 leading-none truncate overflow-hidden text-ellipsis">{replyTarget.author?.name || replyTarget.author?.username || 'User'}</div>
                                <div className="text-[12px] text-white/55 truncate overflow-hidden text-ellipsis max-w-full">{replyTarget.text || (replyTarget.attachments?.length ? 'Вложение' : '')}</div>
                              </div>
                            </button>
                          )}
                          <div className="text-sm text-white/90 pr-8">
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="flex flex-col gap-2 mb-2">
                                {msg.attachments.map((att) => (
                                  <div key={att.id} className="relative">
                                    {att.type === 'image' ? (
                                      <ImageThumb
                                        imageId={`channel-${msg.id}-${att.id}`}
                                        src={att.url}
                                        alt="attachment"
                                        className="max-h-[220px] w-auto max-w-full rounded-[16px] border border-white/10 object-cover hover:opacity-85 transition-smooth"
                                        onOpen={(imageId, src) => {
                                          setActiveImageId(imageId);
                                          setActiveImageSrc(src);
                                        }}
                                      />
                                    ) : (
                                      <a
                                        href={att.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-white/10 bg-white/6 hover:bg-white/10 transition-smooth"
                                      >
                                        <File className="h-4 w-4" />
                                        <span>
                                          {t('servers.fileLabel', { size: Math.round(att.size / 1024) })}
                                        </span>
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {msg.text && (
                              <p className="whitespace-pre-wrap break-words leading-[1.25]">
                                {renderTextWithLinks(msg.text)}
                              </p>
                            )}
                          </div>
                          <div className="absolute bottom-1 right-2 flex items-center gap-1.5">
                            <span className="text-[11px] leading-none text-white/35">
                              {formatClockTime(msg.createdAt)}
                            </span>
                            {msg.userId === user?.id && (
                              <>
                                <CheckCheck className="h-3.5 w-3.5 text-white/35" />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-white/60"
                                  onClick={(e) => handleDeleteClick(e, msg.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="px-6 py-3 border-t border-white/10">
            <div className="flex flex-wrap gap-2">
              {attachments.map((att, index) => (
                <div key={att.id} className="relative group">
                  {att.type === 'image' ? (
                    <ImageThumb
                      imageId={`channel-upload-${att.id}`}
                      src={att.url}
                      alt="attachment"
                      className="max-w-[100px] rounded-2xl border border-white/10"
                      onOpen={(imageId, src) => {
                        setActiveImageId(imageId);
                        setActiveImageSrc(src);
                      }}
                    />
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-2xl text-xs text-white/80">
                      <File className="h-4 w-4" />
                      <span>{t('servers.fileSize', { size: Math.round(att.size / 1024) })}</span>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-200"
                    onClick={() => removeAttachment(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Composer (ReplyBar + Input) */}
        <div className="px-6 py-4 border-0 bg-transparent shadow-none">
          {replyTo && (
            <ReplyBar
              author={replyTo.author}
              text={replyTo.text}
              imageUrl={replyTo.imageUrl}
              onClose={clearReply}
            />
          )}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,*/*"
              onChange={handleFileSelect}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 text-white/70"
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('servers.messagePlaceholder', { channel: channelName })}
              className="flex-1"
              disabled={isSending}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={(!newMessage.trim() && attachments.length === 0) || isSending}
              className="flex-shrink-0"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteScope} onOpenChange={(open) => {
        if (!open) {
          setShowDeleteMenu(null);
          setMessageToDelete(null);
          setDeleteScope(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('servers.messageDeleted')}</DialogTitle>
            <DialogDescription>
              {t('servers.deleteMessageConfirm')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => handleDeleteConfirm('me')}
            >
              {t('servers.deleteForMe')}
            </Button>
            <Button
              variant="ghost"
              className="text-red-200 hover:text-red-200"
              onClick={() => handleDeleteConfirm('all')}
            >
              {t('servers.deleteForEveryone')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Context menu for delete */}
      <AnimatePresence>
        {showDeleteMenu && !deleteScope && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => {
                setShowDeleteMenu(null);
                setMessageToDelete(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed z-50 glass-panel rounded-2xl p-2"
              style={{
                left: Math.min(showDeleteMenu.x, window.innerWidth - 200),
                top: Math.min(showDeleteMenu.y, window.innerHeight - 100),
              }}
            >
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start text-white/80"
                  onClick={() => setDeleteScope('me')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('servers.deleteForMe')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start text-red-200 hover:text-red-200"
                  onClick={() => setDeleteScope('all')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('servers.deleteForEveryone')}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <ImageViewer
        activeImageId={activeImageId}
        src={activeImageSrc}
        onClose={() => {
          setActiveImageId(null);
          setActiveImageSrc(null);
        }}
      />
    </div>
    </LayoutGroup>
  );
};
