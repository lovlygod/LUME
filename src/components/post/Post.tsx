import { MessageCircle, Image as ImageIcon, Smile, Share2, MoreHorizontal, Trash2, Flag, Pin } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { profileAPI, postsAPI, usersAPI } from "@/services/api";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Picker, { Theme } from "emoji-picker-react";
import { useNavigate } from 'react-router-dom';
import { useAuth, isVerifiedUser, isDeveloper, isDeveloperCrown, VerifiedBadge, DeveloperBadge, DeveloperCrownBadge } from "@/contexts/AuthContext";
import { normalizeImageUrl } from "@/lib/utils";
import { toast } from 'sonner';
import { useLanguage } from "@/contexts/LanguageContext";
import { ImageThumb, ImageViewer } from "@/components/media/ImageViewer";
import DOMPurify from "dompurify";

interface PostProps {
  id: string;
  dataPostId?: string;
  userId: string;
  text?: string;
  imageUrl?: string;
  timestamp: string;
  replies: number;
  resonance: number;
  name?: string;
  username?: string;
  avatar?: string;
  verified?: boolean;
  isPinned?: boolean;
  showPinAction?: boolean;
}

const Post = ({ id, dataPostId, userId, text, imageUrl, timestamp, replies, resonance, name, username, avatar, verified, isPinned, showPinAction }: PostProps) => {
  const [user, setUser] = useState<{ id: string; name?: string; username?: string; avatar?: string; verified?: boolean } | null>(null);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(resonance || 0);
  const [replyCount, setReplyCount] = useState(replies || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Array<{ id: string | number; text: string; createdAt: string; name?: string; username?: string; avatar?: string; verified?: boolean }>>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const emojiButtonRef = useRef<HTMLButtonElement | null>(null);
  const emojiPopoverRef = useRef<HTMLDivElement | null>(null);
  const [emojiPosition, setEmojiPosition] = useState<{ top: number; left: number; origin: "top" | "bottom" }>({
    top: 0,
    left: 0,
    origin: "top"
  });
  const isEmojiOpeningRef = useRef(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [activeImageSrc, setActiveImageSrc] = useState<string | null>(null);

  const isOwnPost = currentUser && String(currentUser.id) === String(userId);

  useEffect(() => {
    const fetchResonanceStatus = async () => {
      try {
        const response = await postsAPI.getResonanceStatus(id.toString());
        setLiked(response.liked);
        setLikeCount(response.resonance);
      } catch (error) {
        console.error('Failed to fetch resonance status:', error);
      }
    };

    fetchResonanceStatus();
  }, [id]);

  useEffect(() => {
    if (name !== undefined && username !== undefined) {
      setUser({
        id: userId,
        name,
        username,
        avatar,
        verified: verified || false
      });
    } else {
      const fetchUser = async () => {
        try {
          const response = await profileAPI.getUserById(userId);
          setUser(response.user);
        } catch (error) {
          console.error('Failed to fetch user:', error);
          setUser({
            id: userId,
            name: 'Unknown User',
            username: '@unknown',
            verified: false
          });
        }
      };

      fetchUser();
    }
  }, [userId, name, username, avatar, verified]);

  const sanitizedText = text ? DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }) : text;
  const displayText = sanitizedText && sanitizedText.length > 420 ? sanitizedText.slice(0, 420) + "…" : sanitizedText;

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t("time.justNow");
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleResonance = async () => {
    if (isLiking) return;

    setIsLiking(true);
    setIsAnimating(true);
    const previousLiked = liked;
    const previousCount = likeCount;

    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);

    try {
      const response = await postsAPI.resonance(id.toString());
      setLiked(response.liked);
      setLikeCount(response.resonance);
    } catch (error) {
      console.error('Failed to resonate:', error);
      setLiked(previousLiked);
      setLikeCount(previousCount);
    } finally {
      setIsLiking(false);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await postsAPI.deletePost(id.toString());
      toast.success(t("feed.deletePostSuccess"));
      window.dispatchEvent(new CustomEvent('refreshPosts'));
    } catch (error: unknown) {
      console.error('Failed to delete post:', error);
      const err = error as { message?: string } | null;
      toast.error(err?.message || t("feed.deletePostError"));
    }
  };

  const handleReportPost = async () => {
    if (isReporting) return;

    setIsReporting(true);
    try {
      await postsAPI.reportPost(id.toString(), 'Inappropriate content - reported by user');
      toast.success(t("feed.reportSuccess"));
      setShowPostMenu(false);
    } catch (error: unknown) {
      console.error('Failed to report post:', error);
      const err = error as { message?: string } | null;
      toast.error(err?.message || t("feed.reportError"));
    } finally {
      setIsReporting(false);
    }
  };

  const handlePinPost = async () => {
    if (isPinning) return;

    setIsPinning(true);
    try {
      if (isPinned) {
        await usersAPI.unpinPost();
        toast.success(t("feed.unpinPostSuccess"));
      } else {
        await usersAPI.pinPost(id.toString());
        toast.success(t("feed.pinPostSuccess"));
      }
      setShowPostMenu(false);
      window.dispatchEvent(new CustomEvent('refreshPosts'));
    } catch (error: unknown) {
      console.error('Failed to pin/unpin post:', error);
      const err = error as { message?: string } | null;
      toast.error(err?.message || t("feed.pinPostError"));
    } finally {
      setIsPinning(false);
    }
  };

  const handleReply = async () => {
    if (!showComments && !commentsLoaded) {
      try {
        const response = await postsAPI.getComments(id.toString());
        setComments(response.comments);
        setCommentsLoaded(true);
      } catch (error) {
        console.error('Failed to load comments:', error);
        setComments([]);
      }
    }
    setShowComments(!showComments);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      try {
        const response = await postsAPI.addComment(id.toString(), commentText);

        const newComment = {
          id: response.commentId,
          text: commentText,
          createdAt: new Date().toISOString(),
          name: user?.name || 'Current User',
          username: user?.username || '@current',
          avatar: user?.avatar,
          verified: user?.verified || false
        };

        setComments([...comments, newComment]);
        setCommentText("");
        setReplyCount(replyCount + 1);
      } catch (error) {
        console.error('Failed to add comment:', error);
      }
    }
  };

  const handleEmojiClick = (emojiObject: { emoji: string }) => {
    setCommentText(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const updateEmojiPosition = useCallback(() => {
    const trigger = emojiButtonRef.current;
    const popover = emojiPopoverRef.current;
    if (!trigger || !popover) return;

    const triggerRect = trigger.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const shouldFlip = spaceBelow < popoverRect.height + 12 && spaceAbove > spaceBelow;
    const top = shouldFlip
      ? triggerRect.top - popoverRect.height - 12
      : triggerRect.bottom + 12;
    const left = Math.min(
      Math.max(triggerRect.left, 12),
      window.innerWidth - popoverRect.width - 12
    );

    setEmojiPosition({
      top: Math.max(12, top),
      left,
      origin: shouldFlip ? "bottom" : "top"
    });
  }, []);

  useEffect(() => {
    if (!showEmojiPicker) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowEmojiPicker(false);
    };

    const handleOutsideClick = (event: PointerEvent) => {
      const path = event.composedPath?.() ?? [];
      if (path.includes(emojiPopoverRef.current) || path.includes(emojiButtonRef.current)) {
        return;
      }
      if (isEmojiOpeningRef.current) {
        isEmojiOpeningRef.current = false;
        return;
      }
      setShowEmojiPicker(false);
    };

    const handleScroll = () => updateEmojiPosition();
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updateEmojiPosition);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("pointerdown", handleOutsideClick, true);

    isEmojiOpeningRef.current = false;

    let observer: ResizeObserver | null = null;
    if (emojiPopoverRef.current && "ResizeObserver" in window) {
      observer = new ResizeObserver(() => updateEmojiPosition());
      observer.observe(emojiPopoverRef.current);
    }

    const raf = requestAnimationFrame(() => updateEmojiPosition());

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updateEmojiPosition);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("pointerdown", handleOutsideClick, true);
      if (observer) observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [showEmojiPicker, updateEmojiPosition]);

  if (!user) return null;

  return (
    <LayoutGroup>
      <motion.article
        data-post-id={dataPostId || id}
        className={`relative isolate rounded-[24px] border border-white/6 bg-white/5 px-5 py-5 backdrop-blur-[24px] shadow-[0_18px_50px_rgba(0,0,0,0.35)] transition-smooth hover:bg-white/6 ${
          showPostMenu ? "z-20" : "z-0"
        }`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate(`/profile/${String(userId)}`)}>
            {user?.avatar ? (
              <img
                src={normalizeImageUrl(user.avatar) || ''}
                alt={user.name}
                className="h-9 w-9 rounded-full object-cover hover:opacity-80 transition-smooth"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '';
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : null}
            {!user?.avatar && (
              <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* User Info */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-sm font-medium text-white hover:text-white/80 transition-smooth cursor-pointer"
                onClick={() => navigate(`/profile/${String(userId)}`)}
              >
                {user?.name || 'Loading...'}
              </span>
              {user?.verified && (
                <VerifiedBadge className="h-4 w-4" />
              )}
              {user?.username && (
                isDeveloperCrown(user.username)
                  ? <DeveloperCrownBadge className="h-4 w-4" />
                  : isDeveloper(user.username) && <DeveloperBadge className="h-4 w-4" />
              )}
              <span className="text-xs text-secondary font-mono">
                @{user?.username || ''}
              </span>
              <span className="text-xs text-secondary">·</span>
              <span className="text-xs text-secondary hover:text-white cursor-pointer">
                {formatTimestamp(timestamp)}
              </span>
            </div>

            {/* Post Text */}
            {displayText && (
              <p className="mt-2 text-[15px] leading-relaxed text-white/90 whitespace-pre-wrap">
                {displayText}
              </p>
            )}

            {/* Post Image */}
            {imageUrl && (
              <div className="mt-3 rounded-[20px] border border-white/10 bg-white/4 p-2">
                <ImageThumb
                  imageId={`post-${id}`}
                  src={normalizeImageUrl(imageUrl) || ''}
                  alt="Post"
                  className="max-h-[360px] w-full rounded-[18px] object-cover"
                  onOpen={(imageId, src) => {
                    setActiveImageId(imageId);
                    setActiveImageSrc(src);
                  }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <motion.button
                  onClick={handleReply}
                  className={`group flex items-center gap-2 px-3 py-1.5 rounded-full transition-smooth ${
                    showComments
                      ? 'bg-white/10 text-white'
                      : 'text-white/50 hover:bg-white/5 hover:text-white'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">{replyCount}</span>
                </motion.button>

                <motion.button
                  onClick={handleResonance}
                  disabled={isLiking}
                  className="group flex items-center gap-2 px-3 py-1.5 rounded-full transition-smooth"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="relative">
                    <svg
                      viewBox="0 0 24 24"
                      className={`h-5 w-5 transition-all duration-300 ${
                        liked ? 'text-red-500' : 'text-white/50 group-hover:text-white'
                      } ${isAnimating ? 'animate-like-wiggle' : ''}`}
                      fill={liked ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth={liked ? 0 : 2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                      />
                    </svg>
                  </div>
                  <span className={`text-xs font-medium ${liked ? 'text-white' : 'text-white/50'}`}>{likeCount}</span>
                </motion.button>
              </div>

              {/* Post Menu */}
              <div className="relative">
                <motion.button
                  onClick={() => setShowPostMenu(!showPostMenu)}
                  className="p-2 rounded-full text-white/40 hover:bg-white/5 transition-smooth"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </motion.button>

                <AnimatePresence>
                  {showPostMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] z-50 overflow-hidden"
                    >
                      {isOwnPost ? (
                        <>
                          <button
                            onClick={() => {
                              handlePinPost();
                            }}
                            disabled={isPinning}
                            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-white/5 transition-smooth disabled:opacity-50"
                          >
                            {isPinning ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                              <Pin className={`h-4 w-4 ${isPinned ? 'fill-current' : ''}`} />
                            )}
                            <span>{isPinned ? t("feed.unpinPost") : t("feed.pinPost")}</span>
                          </button>
                          <button
                            onClick={() => {
                              handleDeletePost();
                              setShowPostMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-200 hover:bg-white/5 transition-smooth"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>{t("feed.deletePost")}</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            handleReportPost();
                          }}
                          disabled={isReporting}
                          className="w-full flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-white/5 transition-smooth disabled:opacity-50"
                        >
                          {isReporting ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <Flag className="h-4 w-4" />
                          )}
                          <span>{isReporting ? t("feed.reporting") : t("feed.reportPost")}</span>
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Comments Section */}
            <AnimatePresence>
              {showComments && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  className="mt-4 ml-3 pl-4 border-l border-white/10"
                >
                  <form onSubmit={handleCommentSubmit} className="flex items-start gap-2 mb-4">
                    <div className="flex-shrink-0">
                      {currentUser?.avatar ? (
                        <img
                          src={normalizeImageUrl(currentUser.avatar) || ''}
                          alt={currentUser.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white">
                          {currentUser?.name?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={t("feed.writeComment")}
                        className="glass-input w-full px-4 py-2 text-sm text-white"
                      />

                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                        <motion.button
                          ref={emojiButtonRef}
                          type="button"
                          onClick={() => {
                            isEmojiOpeningRef.current = !showEmojiPicker;
                            setShowEmojiPicker(!showEmojiPicker);
                          }}
                          className="text-white/40 hover:text-white transition-smooth"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Smile className="h-4 w-4" />
                        </motion.button>

                        <AnimatePresence>
                          {showEmojiPicker && createPortal(
                            <motion.div
                              ref={emojiPopoverRef}
                              initial={{ opacity: 0, scale: 0.96, y: emojiPosition.origin === "top" ? -6 : 6 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.96, y: emojiPosition.origin === "top" ? -6 : 6 }}
                              transition={{ duration: 0.18 }}
                              className="fixed z-[9999]"
                              style={{ top: emojiPosition.top, left: emojiPosition.left, transformOrigin: emojiPosition.origin }}
                            >
                              <Picker
                                onEmojiClick={handleEmojiClick}
                                theme={Theme.DARK}
                                previewConfig={{ showPreview: false }}
                              />
                            </motion.div>,
                            document.body
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <motion.button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="rounded-full px-4 py-2 text-sm text-white/80 bg-white/5 disabled:opacity-50 transition-smooth"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {t("feed.reply")}
                    </motion.button>
                  </form>

                  <div className="space-y-3">
                    {comments.length > 0 ? (
                      comments.map((comment) => (
                        <motion.div
                          key={comment.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex gap-2"
                        >
                          <div className="flex-shrink-0">
                            {comment.avatar ? (
                              <img
                                src={normalizeImageUrl(comment.avatar) || ''}
                                alt={comment.name}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white">
                                {comment.name?.charAt(0) || 'U'}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="bg-white/5 rounded-2xl px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-white">{comment.name}</span>
                                {comment.verified && (
                                  <VerifiedBadge className="h-3.5 w-3.5" />
                                )}
                                {comment.username && (
                                  isDeveloperCrown(comment.username)
                                    ? <DeveloperCrownBadge className="h-3.5 w-3.5" />
                                    : isDeveloper(comment.username) && <DeveloperBadge className="h-3.5 w-3.5" />
                                )}
                              </div>
                              <p className="text-sm mt-0.5 text-white/80">{comment.text}</p>
                            </div>
                            <div className="text-xs text-secondary mt-1 px-2">
                              {comment.createdAt && comment.createdAt !== '0' ? formatTimestamp(comment.createdAt) : ''}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-sm text-secondary italic py-2">
                        {t("feed.noComments")}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.article>
      <ImageViewer
        activeImageId={activeImageId}
        src={activeImageSrc}
        onClose={() => {
          setActiveImageId(null);
          setActiveImageSrc(null);
        }}
      />
    </LayoutGroup>
  );
};

export default Post;
