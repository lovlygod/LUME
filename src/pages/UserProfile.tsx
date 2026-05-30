import { useState, useEffect } from 'react';
import { Calendar, MapPin, Link as LinkIcon, MessageCircle, UserPlus, UserCheck, Users, Code, CheckCircle, Search, Clock, Github, FolderKanban, ExternalLink, QrCode } from "lucide-react";
import { motion } from "framer-motion";
import { profileAPI, postsAPI, onboardingAPI, projectsAPI, economyAPI } from "@/services/api";
import type { User } from "@/types/api";
import { useParams } from 'react-router-dom';
import Post from "@/components/post/Post";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from 'react-router-dom';
import { normalizeImageUrl } from "@/lib/utils";
import { isVerifiedUser, isDeveloper, isDeveloperCrown, VerifiedBadge, DeveloperBadge, DeveloperCrownBadge } from "@/contexts/AuthContext";
import { toast } from 'sonner';
import { useLanguage } from "@/contexts/LanguageContext";
import FollowModal from "@/components/profile/FollowModal";
import QRCodeModal from "@/components/profile/QRCodeModal";
import { getProfileRoute } from "@/lib/profileRoute";

const UserProfile = () => {
  const { user: currentUser } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  type UserPost = {
    id: string | number;
    user_id?: string | number;
    userId?: string | number;
    text?: string;
    image_url?: string;
    image_urls?: string[];
    imageUrl?: string;
    imageUrls?: string[];
    timestamp?: string;
    replies?: number;
    resonance?: number;
    name?: string;
    username?: string;
    avatar?: string;
    verified?: boolean;
  };
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  
  // Followers/Following modal
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'followers' | 'following'>('followers');
  const [followersList, setFollowersList] = useState<User[]>([]);
  const [followingList, setFollowingList] = useState<User[]>([]);

  // QR Code modal
  const [showQRModal, setShowQRModal] = useState(false);

  // Dev profile data
  const [projects, setProjects] = useState<Array<{ id: number; name: string; slug: string; status: string }>>([]);
  const [displayedUsernames, setDisplayedUsernames] = useState<Array<{ username: string; order: number }>>([]);

  const normalizeBooleanLike = (value: unknown, fallback = false): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
      if (['false', '0', 'no', 'off'].includes(normalized)) return false;
    }
    return fallback;
  };

  const normalizeDisplayOrderLike = (value: unknown): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const normalizeUsernameLike = (value: unknown): string => {
    return String(value || '')
      .trim()
      .replace(/^@+/, '')
      .replace(/[\s,.;:]+$/g, '');
  };

  const loadDisplayedUsernames = async (targetUserId: string | number) => {
    const myNames = await economyAPI.getUserUsernames(targetUserId);
    const rawPayload = Array.isArray(myNames.usernames) ? myNames.usernames : [];
    const pinned = rawPayload
      .map((row) => ({
        username: normalizeUsernameLike((row as Record<string, unknown>)?.username),
        order: normalizeDisplayOrderLike((row as Record<string, unknown>)?.display_order),
        isVisible: normalizeBooleanLike((row as Record<string, unknown>)?.is_visible, true),
      }))
      .filter((row) => row.username.length > 0 && row.isVisible && row.order != null && row.order >= 1 && row.order <= 10)
      .sort((a, b) => Number(a.order) - Number(b.order))
      .map((row) => ({ username: row.username, order: Number(row.order) }));
    setDisplayedUsernames(pinned);
  };

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!userId) {
          setError('User ID is required');
          setLoading(false);
          return;
        }

        // Fetch user by ID
        const response = await profileAPI.getUserById(userId);
        setUser(response.user);
        const resolvedUserId = response.user?.id || userId;

        // Load projects (if user has dev profile fields)
        if (response.user.onboardingCompleted || response.user.skills?.length || response.user.primaryRole) {
          try {
            const projectsRes = await projectsAPI.getMy();
            setProjects((projectsRes.projects || []).slice(0, 4));
          } catch (e) {
            console.error('Failed to load projects:', e);
          }
        }

        // Check if we're following this user
        try {
          const followStatus = await onboardingAPI.checkFollowing(resolvedUserId);
          setIsFollowing(followStatus.following);
        } catch (e) {
          console.error('Failed to load follow status:', e);
        }

        // Load user's posts
        const postsResponse = await postsAPI.getUserPosts(resolvedUserId);
        setPosts(postsResponse.posts);

        try {
          await loadDisplayedUsernames(resolvedUserId);
        } catch {
          setDisplayedUsernames([]);
        }
      } catch (err: unknown) {
        console.error('Failed to load profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const handleFollowToggle = async () => {
    if (!user || isFollowLoading) return;

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await onboardingAPI.unfollow(user.id);
        toast.success(t("toast.unfollowed"));
        setIsFollowing(false);
        setUser(prev => prev ? { ...prev, followers_count: Math.max(0, (prev.followers_count || 1) - 1) } : null);
      } else {
        await onboardingAPI.batchFollow([user.id]);
        toast.success(t("toast.followed"));
        setIsFollowing(true);
        setUser(prev => prev ? { ...prev, followers_count: (prev.followers_count || 0) + 1 } : null);
      }
    } catch (error: unknown) {
      console.error('Failed to toggle follow:', error);
      toast.error(error instanceof Error ? error.message : t("toast.followError"));
    } finally {
      setIsFollowLoading(false);
    }
  };

  const openFollowModal = async (tab: 'followers' | 'following') => {
    if (!user) return;

    setModalTab(tab);
    setShowFollowModal(true);

    try {
      if (tab === 'followers') {
        const res = await onboardingAPI.getFollowers(user.id);
        setFollowersList(res.followers);
        // Update user object with accurate count from API
        setUser(prev => prev ? { ...prev, followers_count: res.followers.length } : null);
      } else {
        const res = await onboardingAPI.getFollowing(user.id);
        setFollowingList(res.following);
        // Update user object with accurate count from API
        setUser(prev => prev ? { ...prev, following_count: res.following.length } : null);
      }
    } catch (error: unknown) {
      console.error('Failed to load list:', error);
      toast.error(t("toast.loadFollowersError"));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white">{t("profile.loadingProfile")}</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-200 text-lg font-semibold mb-2">
            {error || t("profile.userNotFound")}
          </div>
          <p className="text-secondary text-sm">
            {t("profile.profileNotFoundDesc")}
          </p>
        </div>
      </div>
    );
  }

  const coverImageUrl = user.banner;
  const avatarImageUrl = user.avatar;

  return (
    <div className="min-h-screen">
      {/* Header / Cover */}
      <div className="relative h-36 w-full overflow-hidden rounded-b-[28px]">
        {coverImageUrl ? (
          <img
            src={normalizeImageUrl(coverImageUrl) || ''}
            alt="Cover"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-white/5" />
        )}
      </div>

      {/* Profile Info */}
      <div className="relative px-6 pb-5">
        <div className="-mt-16 flex items-end">
          <div className="relative">
            {avatarImageUrl ? (
                <img
                  src={normalizeImageUrl(avatarImageUrl) || ''}
                  alt={user.name}
                  className="h-28 w-28 rounded-[28px] border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.35)] object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '';
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : null}
            {!avatarImageUrl && (
              <motion.div
                className="flex h-28 w-28 items-center justify-center rounded-full border border-white/10 bg-white/10 text-3xl font-semibold text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {user.name.charAt(0)}
              </motion.div>
            )}
          </div>

            <div className="ml-4 flex-1 flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-white">{user.name}</h1>
                {isVerifiedUser(user) && (
                  <VerifiedBadge className="h-4 w-4" />
                )}
                {isDeveloperCrown(user.username)
                  ? <DeveloperCrownBadge className="h-4 w-4" />
                  : isDeveloper(user.username) && <DeveloperBadge className="h-4 w-4" />
                }
                {/* Role badge near name */}
                {user.primaryRole && (
                  <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-300">
                    {user.primaryRole}
                  </span>
                )}
              </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  {displayedUsernames.length > 0 ? displayedUsernames.map((item) => {
                    const isTopPinned = item.order === 1;
                    return (
                      <span
                        key={`${item.order}-${item.username}`}
                        className={`text-sm font-mono leading-none ${isTopPinned ? 'font-bold text-violet-300' : 'font-normal text-secondary'}`}
                      >
                        @{item.username}
                      </span>
                    );
                  }) : (
                    <p className="text-sm text-secondary font-mono">@{user.username}</p>
                  )}
                  {user.availability && (
                    <span className="flex items-center gap-1 text-[10px]">
                      <span className={`h-1.5 w-1.5 rounded-full ${user.availability === 'open' ? 'bg-green-400' : user.availability === 'looking' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                      <span className="text-white/40">{user.availability === 'open' ? t('profile.available') : user.availability === 'looking' ? t('profile.looking') : t('profile.busy')}</span>
                    </span>
                  )}
                </div>
              </div>
            {/* Action Buttons - only if not own profile */}
            {currentUser && user.id !== currentUser.id && String(user.id) !== String(currentUser.id) && (
              <div className="relative mt-2">
                <div className="flex gap-2">
                  <motion.button
                    onClick={handleFollowToggle}
                    disabled={isFollowLoading}
                    className={`btn-glass gap-2 ${isFollowing ? '' : isVerifiedUser(user) ? 'bg-blue-500/80 hover:bg-blue-500' : ''}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isFollowLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : isFollowing ? (
                      <>
                        <UserCheck className="h-4 w-4" />
                        <span>{t("profile.followingLabel")}</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        <span>{t("profile.follow")}</span>
                      </>
                    )}
                  </motion.button>
                  <motion.button
                    onClick={() => navigate(`/messages?userId=${user.id}`)}
                    className="btn-glass gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>{t("profile.message")}</span>
                  </motion.button>
                </div>
                <motion.button
                  onClick={() => setShowQRModal(true)}
                  className="btn-glass gap-2 absolute top-full right-0 mt-2 z-10"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <QrCode className="h-4 w-4" />
                  <span>QR</span>
                </motion.button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {/* City & Website */}
          {(user.city || user.website) && (
            <div className="flex flex-col gap-2 text-sm text-secondary">
              {user.city && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>{user.city}</span>
                </div>
              )}
              {user.website && (
                <a
                  href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-white hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>{user.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
            </div>
          )}

          {/* Bio */}
          <p className="text-sm text-white/80 leading-relaxed break-words">
            {user.bio || t("profile.noBio")}
          </p>

          {/* Skills - compact row */}
          {user.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {user.skills.slice(0, 10).map((skill: string) => (
                <span key={skill} className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-white/50">
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* Links & Projects */}
          {(user.githubUrl || user.telegramUsername || projects.length > 0) && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Links */}
              {user.githubUrl && (
                <a href={user.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                  <Github className="h-3 w-3" />
                  <span>GitHub</span>
                </a>
              )}
              {user.telegramUsername && (
                <a href={`https://t.me/${user.telegramUsername}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                  <MessageCircle className="h-3 w-3" />
                  <span>Telegram</span>
                </a>
              )}

              {/* Projects */}
              {projects.length > 0 && (
                <div className="flex gap-2">
                  {projects.slice(0, 3).map((project) => (
                    <button key={project.id} onClick={() => navigate(`/projects/${project.slug}`)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 transition-colors">
                      <FolderKanban className="h-3 w-3" />
                      <span>{project.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

{/* Stats */}
          <div className="flex items-center gap-4 pt-2 text-sm border-t border-white/5">
            <button onClick={() => openFollowModal('followers')} className="hover:text-white">
              <span className="font-semibold text-white">{user.followers_count || 0}</span>
              <span className="text-secondary ml-1">{t("profile.followers")}</span>
            </button>
            <button onClick={() => openFollowModal('following')} className="hover:text-white">
              <span className="font-semibold text-white">{user.following_count || 0}</span>
              <span className="text-secondary ml-1">{t("profile.following")}</span>
            </button>
          </div>
        </div>

      <FollowModal
        open={showFollowModal}
        tab={modalTab}
        onTabChange={openFollowModal}
        followers={followersList}
        following={followingList}
        onClose={() => setShowFollowModal(false)}
      />

      <QRCodeModal
        open={showQRModal}
        onClose={() => setShowQRModal(false)}
        data={window.location.origin + getProfileRoute(user)}
        username={user.username}
        avatarUrl={avatarImageUrl || undefined}
      />
{/* Posts Section */}
      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-white">{t("profile.signals")}</h3>
          <span className="text-xs text-secondary">{posts.length} posts</span>
        </div>
        {posts.length > 0 ? (
          <div className="space-y-[16px]">
            {posts.map((post) => (
              <Post
                key={post.id}
                id={post.id.toString()}
                userId={String(post.user_id || post.userId)}
                text={post.text}
                imageUrl={post.image_url || post.imageUrl}
                imageUrls={post.image_urls || post.imageUrls}
                timestamp={post.timestamp}
                replies={post.replies}
                resonance={post.resonance}
                name={post.name}
                username={post.username}
                avatar={post.avatar}
                verified={post.verified}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-6 text-center">
            <p className="text-sm text-secondary">{t("profile.noSignals")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
