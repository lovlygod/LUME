import { useState, useEffect } from 'react';
import { Calendar, MapPin, Link as LinkIcon, MessageCircle, UserPlus, UserCheck, Users } from "lucide-react";
import { motion } from "framer-motion";
import { profileAPI, postsAPI, onboardingAPI } from "@/services/api";
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
    imageUrl?: string;
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

            <div className="ml-4 flex-1 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-white">{user.name}</h1>
                {isVerifiedUser(user) && (
                  <VerifiedBadge className="h-4 w-4" />
                )}
                {isDeveloperCrown(user.username)
                  ? <DeveloperCrownBadge className="h-4 w-4" />
                  : isDeveloper(user.username) && <DeveloperBadge className="h-4 w-4" />
                }
              </div>
                <p className="text-sm text-secondary">@{user.username}</p>
              </div>
            {/* Action Buttons - only if not own profile */}
            {currentUser && user.id !== currentUser.id && String(user.id) !== String(currentUser.id) && (
              <div className="flex gap-2 mt-2">
                <motion.button
                  onClick={handleFollowToggle}
                  disabled={isFollowLoading}
                  className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-smooth disabled:opacity-50 ${
                    isFollowing
                      ? 'bg-white/10 text-white hover:bg-white/15'
                      : 'bg-white/10 text-white hover:bg-white/15'
                  }`}
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
                  className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold bg-white/10 text-white hover:bg-white/15 transition-smooth"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{t("profile.message")}</span>
                </motion.button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          {/* Stats - Followers/Following */}
          <div className="flex items-center gap-5 text-base">
            <button
              onClick={() => openFollowModal('followers')}
              className="flex items-center gap-1 hover:text-white transition-smooth"
            >
              <span className="font-semibold text-white text-base">{user.followers_count || 0}</span>
              <span className="text-secondary text-sm">{t("profile.followers")}</span>
            </button>
            <button
              onClick={() => openFollowModal('following')}
              className="flex items-center gap-1 hover:text-white transition-smooth"
            >
              <span className="font-semibold text-white text-base">{user.following_count || 0}</span>
              <span className="text-secondary text-sm">{t("profile.following")}</span>
            </button>
          </div>

          {/* Bio */}
          <p className="mt-3 text-sm text-white/90 leading-relaxed">
            {user.bio || t("profile.noBio")}
          </p>

          {/* City & Website */}
          <div className="mt-3 flex flex-col gap-2 text-sm text-secondary">
            {user.city && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                <span>{user.city}</span>
              </div>
            )}
            {user.website && (
              <a
                href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-white/80 hover:underline"
              >
                <LinkIcon className="h-3.5 w-3.5" />
                <span>{user.website.replace(/^https?:\/\//, '')}</span>
              </a>
            )}
          </div>

          {/* Meta info - Join date */}
          <div className="mt-3 flex items-center gap-4 text-sm text-secondary">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {t("profile.joined")}{" "}
                {user.joinDate && !Number.isNaN(Date.parse(user.joinDate))
                  ? new Date(user.joinDate).toLocaleDateString("ru-RU", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "-"}
              </span>
            </div>
          </div>
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
          <div className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-6 text-center">
            <p className="text-sm text-secondary">{t("profile.noSignals")}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
