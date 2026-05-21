import { useState, useEffect } from 'react';
import { Calendar, Camera, MapPin, Link as LinkIcon, Edit2, Save, X, MessageCircle, Pin, ExternalLink, UserPlus, UserCheck, Users, BadgeCheck, Github, Code, Briefcase, FolderKanban, CheckCircle, Search, Clock, ChevronDown, QrCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { profileAPI, postsAPI, usersAPI, onboardingAPI, searchAPI, projectsAPI } from "@/services/api";
import type { User } from "@/types/api";
import { useAuth, isVerifiedUser, isDeveloper, isDeveloperCrown, VerifiedBadge, DeveloperBadge, DeveloperCrownBadge } from "@/contexts/AuthContext";
import Post from "@/components/post/Post";
import { normalizeImageUrl } from "@/lib/utils";
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from "@/contexts/LanguageContext";
import FollowModal from "@/components/profile/FollowModal";
import QRCodeModal from "@/components/profile/QRCodeModal";
import { getProfileRoute } from "@/lib/profileRoute";

type PostItem = {
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

type UserProject = {
  id: number;
  name: string;
  slug: string;
  status: string;
  description?: string | null;
};

const ProfilePage = () => {
  const { user: authUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [pinnedPost, setPinnedPost] = useState<PostItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    username: '',
    bio: '',
    city: '',
    website: '',
    primaryRole: '',
    skills: '',
    availability: 'open',
    availabilityOpen: false,
    roleOpen: false,
    githubUrl: '',
    telegramUsername: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
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
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Type helpers for dev profile fields
  const devUser = user as { primaryRole?: string; skills?: string[]; availability?: string; githubUrl?: string; telegramUsername?: string } | null;

  // Determine if viewing own profile
  const isOwnProfile = authUser && user 
    ? String(authUser.id) === String(user.id)
    : false;

  const handleFollowToggle = async () => {
    if (!user || isFollowLoading) return;

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        await onboardingAPI.unfollow(user.id);
        toast.success(t("toast.unfollowed"));
        setIsFollowing(false);
        setUser(prev => prev ? { ...prev, followers_count: Math.max(0, (prev.followers_count || 1) - 1) } : null);
      } else {
        // Follow
        await onboardingAPI.batchFollow([user.id]);
        toast.success(t("toast.followed"));
        setIsFollowing(true);
        setUser(prev => prev ? { ...prev, followers_count: (prev.followers_count || 0) + 1 } : null);
      }
    } catch (error: unknown) {
      console.error('Failed to toggle follow:', error);
      const err = error as { message?: string } | null;
      toast.error(err?.message || t("toast.followError"));
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
      } else {
        const res = await onboardingAPI.getFollowing(user.id);
        setFollowingList(res.following);
      }
    } catch (error: unknown) {
      console.error('Failed to load list:', error);
      toast.error(t("toast.loadFollowersError"));
    }
  };

  const loadProfileAndPosts = async () => {
    try {
      const response = await profileAPI.getCurrentUser();
      setUser(response.user);
      setEditData({
        name: response.user.name,
        username: response.user.username,
        bio: response.user.bio || '',
        city: response.user.city || '',
        website: response.user.website || '',
        primaryRole: response.user.primaryRole || '',
        skills: response.user.skills?.join(', ') || '',
        availability: response.user.availability || 'open',
        githubUrl: response.user.githubUrl || '',
        telegramUsername: response.user.telegramUsername || ''
      });

      // Load user's projects if dev profile fields exist
      if (response.user.onboardingCompleted || response.user.skills?.length || response.user.primaryRole) {
        try {
          setLoadingProjects(true);
          const projectsRes = await projectsAPI.getMy();
          setProjects((projectsRes.projects || []).slice(0, 4));
        } catch (e) {
          console.error('Failed to load projects:', e);
        } finally {
          setLoadingProjects(false);
        }
      }

      // Check if we're viewing another user's profile - load follow status
      const isAnotherUser = authUser && String(authUser.id) !== String(response.user.id);
      if (isAnotherUser) {
        try {
          const followStatus = await onboardingAPI.checkFollowing(response.user.id);
          setIsFollowing(followStatus.following);
        } catch (e) {
          console.error('Failed to load follow status:', e);
        }
      }

      // Load pinned post if exists
      if (response.user.pinned_post_id) {
        try {
          const postsResponse = await postsAPI.getUserPosts(response.user.id);
          const pinned = postsResponse.posts.find(p => p.id.toString() === response.user.pinned_post_id);
          if (pinned) {
            setPinnedPost(pinned);
          }
        } catch (e) {
          console.error('Failed to load pinned post:', e);
        }
      }

      const postsResponse = await postsAPI.getUserPosts(response.user.id);
      // Filter out pinned post from regular posts
      const regularPosts = postsResponse.posts.filter(p => 
        !response.user.pinned_post_id || p.id.toString() !== response.user.pinned_post_id
      );
      setPosts(regularPosts);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  useEffect(() => {
    loadProfileAndPosts();

    const handleRefreshPosts = () => {
      loadProfileAndPosts();
    };

    window.addEventListener('refreshPosts', handleRefreshPosts);

    return () => {
      window.removeEventListener('refreshPosts', handleRefreshPosts);
    };
  }, []);

  const handleEditToggle = () => {
    if (isEditing) {
      if (user) {
        setEditData({
          name: user.name,
          username: user.username,
          bio: user.bio || '',
          city: user.city || '',
          website: user.website || ''
        });
      }
      setIsEditing(false);
      setAvatarPreview(null);
      setBannerPreview(null);
    } else {
      setIsEditing(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      // Update via new API
      await usersAPI.updateProfile({
        name: editData.name,
        username: editData.username,
        bio: editData.bio,
        city: editData.city,
        website: editData.website,
        primaryRole: editData.primaryRole,
        skills: editData.skills ? editData.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        availability: editData.availability,
        githubUrl: editData.githubUrl,
        telegramUsername: editData.telegramUsername
      });

      // Update local state (already done in usersAPI.updateProfile)
      setUser(prev => prev ? {
        ...prev,
        name: editData.name,
        username: editData.username,
        bio: editData.bio,
        city: editData.city,
        website: editData.website,
        primaryRole: editData.primaryRole,
        skills: editData.skills ? editData.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        availability: editData.availability,
        githubUrl: editData.githubUrl,
        telegramUsername: editData.telegramUsername
      } : null);

      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];

    try {
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);

      const response = await profileAPI.uploadAvatar(file);
      const uploaded = response as { avatar?: string };
      setUser(prev => prev ? { ...prev, avatar: uploaded.avatar } : null);
      toast.success(t("profile.avatarUpdated") || "Аватар обновлён");
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      toast.error(t("profile.avatarError") || "Не удалось загрузить аватар");
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];

    try {
      const previewUrl = URL.createObjectURL(file);
      setBannerPreview(previewUrl);

      const response = await profileAPI.uploadBanner(file);
      const uploaded = response as { banner?: string };
      setUser(prev => prev ? { ...prev, banner: uploaded.banner } : null);
    } catch (error) {
      console.error('Failed to upload banner:', error);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-transparent mx-auto mb-4" />
          <p className="text-secondary">{t("profile.loadingProfile")}</p>
        </div>
      </div>
    );
  }

  const coverImageUrl = bannerPreview || user.banner;
  const avatarImageUrl = avatarPreview || user.avatar;

  return (
    <div className="min-h-screen">
      {/* Cover Image */}
      <div className="relative h-48 w-full overflow-hidden rounded-b-[28px]">
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

        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center cursor-pointer"
          >
            <label className="flex flex-col items-center gap-2 cursor-pointer">
              <Camera className="h-8 w-8 text-white" />
              <span className="text-white text-sm font-medium">{t("profile.changeCover")}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBannerChange}
              />
            </label>
          </motion.div>
        )}
      </div>

      {/* Profile Info */}
      <div className="relative px-6 pb-8 -mt-16">
        <div className="flex items-end justify-between">
          {/* Avatar */}
          <div className="relative">
            <div className="relative">
              {avatarImageUrl ? (
                <img
                  src={normalizeImageUrl(avatarImageUrl) || ''}
                  alt={user.name}
                  className="h-[120px] w-[120px] rounded-[28px] border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.35)] object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '';
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : null}
              {!avatarImageUrl && (
                <div className="h-[120px] w-[120px] rounded-[28px] border border-white/10 bg-white/10 flex items-center justify-center text-4xl font-semibold text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
                  {user.name.charAt(0)}
                </div>
              )}

              {/* Verified Badge */}
              {isVerifiedUser(user) && (
                <div className="absolute -bottom-1 -right-1">
                  <VerifiedBadge className="h-7 w-7" />
                </div>
              )}
            </div>

            {isEditing && (
              <label className="absolute bottom-0 right-0 bg-white/10 rounded-full p-2.5 cursor-pointer shadow-lg hover:bg-white/15 transition-smooth">
                <Camera className="h-4 w-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {isOwnProfile && (
              <>
                <motion.button
                  className="btn-glass"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowQRModal(true)}
                >
                  <QrCode className="h-4 w-4" />
                  <span>QR</span>
                </motion.button>
                <motion.button
                  className="btn-glass"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleEditToggle}
                >
                  {isEditing ? (
                    <>
                      <X className="h-4 w-4" />
                      <span>{t("common.cancel")}</span>
                    </>
                  ) : (
                    <>
                      <Edit2 className="h-4 w-4" />
                      <span>{t("profile.editProfile")}</span>
                    </>
                  )}
                </motion.button>
              </>
            )}
            {!isOwnProfile && user && (
              <div className="flex gap-2">
              <motion.button
                onClick={handleFollowToggle}
                disabled={isFollowLoading}
                className={`btn-glass ${
                  !isFollowing && isVerifiedUser(user)
                    ? "bg-blue-500/80 text-white hover:bg-blue-500"
                    : ""
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
                  className="btn-glass"
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

        {/* Profile Details */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                key="editing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-white mb-2">{t("profile.name")}</label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    className="glass-input w-full px-5 py-3 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">{t("profile.username")}</label>
                  <input
                    type="text"
                    value={editData.username}
                    onChange={(e) => setEditData({...editData, username: e.target.value})}
                    className="glass-input w-full px-5 py-3 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">{t("profile.bio")}</label>
                  <textarea
                    value={editData.bio}
                    onChange={(e) => setEditData({...editData, bio: e.target.value})}
                    className="glass-input w-full min-h-[120px] resize-y px-5 py-3 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">{t("profile.city")}</label>
                  <input
                    type="text"
                    value={editData.city}
                    onChange={(e) => setEditData({...editData, city: e.target.value})}
                    className="glass-input w-full px-5 py-3 text-sm text-white"
                    placeholder={t("profile.city")}
                    maxLength={64}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">{t("profile.website")}</label>
                  <input
                    type="text"
                    value={editData.website}
                    onChange={(e) => setEditData({...editData, website: e.target.value})}
                    className="glass-input w-full px-5 py-3 text-sm text-white"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Роль</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setEditData({...editData, roleOpen: !editData.roleOpen})}
                      className="glass-input w-full px-5 py-3 text-sm text-white flex items-center justify-between"
                    >
                      <span>{editData.primaryRole || 'Выберите роль'}</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {editData.roleOpen && (
                      <div className="absolute z-10 mt-1 w-full glass-dropdown max-h-60 overflow-y-auto">
                        {['Frontend Developer', 'Backend Developer', 'Fullstack Developer', 'Mobile Developer', 'DevOps', 'Designer', 'Product Manager', 'QA Engineer', 'Data Scientist', 'AI/ML Engineer', 'Game Developer', 'Other'].map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => setEditData({...editData, primaryRole: role, roleOpen: false})}
                            className={`w-full px-5 py-2.5 text-sm text-left text-white hover:bg-white/10 ${
                              editData.primaryRole === role ? 'bg-white/10' : ''
                            }`}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Навыки (через запятую)</label>
                  <input
                    type="text"
                    value={editData.skills}
                    onChange={(e) => setEditData({...editData, skills: e.target.value})}
                    className="glass-input w-full px-5 py-3 text-sm text-white"
                    placeholder="React, TypeScript, Node.js"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Доступность</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setEditData({...editData, availabilityOpen: !editData.availabilityOpen})}
                      className="glass-input w-full px-5 py-3 text-sm text-white flex items-center justify-between"
                    >
                      <span>
                        {editData.availability === 'open' && 'Открыт к предложениям'}
                        {editData.availability === 'busy' && 'Занят'}
                        {editData.availability === 'looking' && 'Ищу проект'}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {editData.availabilityOpen && (
                      <div className="absolute z-10 mt-1 w-full glass-dropdown">
                        <button
                          type="button"
                          onClick={() => setEditData({...editData, availability: 'open', availabilityOpen: false})}
                          className="w-full px-5 py-2.5 text-sm text-left text-white hover:bg-white/10"
                        >
                          Открыт к предложениям
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditData({...editData, availability: 'busy', availabilityOpen: false})}
                          className="w-full px-5 py-2.5 text-sm text-left text-white hover:bg-white/10"
                        >
                          Занят
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditData({...editData, availability: 'looking', availabilityOpen: false})}
                          className="w-full px-5 py-2.5 text-sm text-left text-white hover:bg-white/10"
                        >
                          Ищу проект
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">GitHub URL</label>
                  <input
                    type="text"
                    value={editData.githubUrl}
                    onChange={(e) => setEditData({...editData, githubUrl: e.target.value})}
                    className="glass-input w-full px-5 py-3 text-sm text-white"
                    placeholder="https://github.com/username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Telegram</label>
                  <input
                    type="text"
                    value={editData.telegramUsername}
                    onChange={(e) => setEditData({...editData, telegramUsername: e.target.value})}
                    className="glass-input w-full px-5 py-3 text-sm text-white"
                    placeholder="username"
                  />
                </div>

                <motion.button
                  disabled={isUpdating}
                  onClick={handleSaveProfile}
                  className="btn-glass w-full"
                  whileHover={isUpdating ? {} : { scale: 1.02 }}
                  whileTap={isUpdating ? {} : { scale: 0.98 }}
                >
                  {isUpdating ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>{t("settings.saving")}</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>{t("settings.saveChanges")}</span>
                    </>
                  )}
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="viewing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {/* Name with role badge */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-semibold text-white">{user.name}</h1>
                    {isOwnProfile && (
                      <button
                        type="button"
                        onClick={() => navigate("/verified")}
                        className="inline-flex items-center justify-center rounded-full p-1 text-sky-300 hover:text-sky-200 hover:bg-white/10 transition-smooth"
                        aria-label={t("verified")}
                        title={t("verified")}
                      >
                        <BadgeCheck className="h-5 w-5" />
                      </button>
                    )}
                    {isVerifiedUser(user) && (
                      <VerifiedBadge className="h-5 w-5" />
                    )}
                    {isDeveloperCrown(user.username)
                      ? <DeveloperCrownBadge className="h-5 w-5" />
                      : isDeveloper(user.username) && <DeveloperBadge className="h-5 w-5" />
                    }
                    {/* Role badge */}
                    {devUser?.primaryRole && (
                      <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-300">
                        {devUser.primaryRole}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-secondary font-mono">@{user.username}</p>
                    {devUser?.availability && (
                      <span className="flex items-center gap-1 text-[10px]">
                        <span className={`h-1.5 w-1.5 rounded-full ${devUser.availability === 'open' ? 'bg-green-400' : devUser.availability === 'looking' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                        <span className="text-white/40">{devUser.availability === 'open' ? t('profile.available') : devUser.availability === 'looking' ? t('profile.looking') : t('profile.busy')}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* City & Website */}
                <div className="mt-3 flex flex-col gap-2 text-sm text-secondary">
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

                {/* Bio */}
                <p className="mt-4 text-sm text-white/80 leading-relaxed break-words">
                  {user.bio || t("profile.noBio")}
                </p>

                {/* Skills - compact row */}
                {devUser?.skills?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {devUser.skills.slice(0, 10).map((skill: string) => (
                      <span key={skill} className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-white/50">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Links & Projects */}
                {(devUser?.githubUrl || devUser?.telegramUsername || projects.length > 0) && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {/* Links */}
                    {devUser?.githubUrl && (
                      <a href={devUser.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                        <Github className="h-3 w-3" />
                        <span>GitHub</span>
                      </a>
                    )}
                    {devUser?.telegramUsername && (
                      <a href={`https://t.me/${devUser.telegramUsername}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors">
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
                <div className="mt-4 flex items-center gap-4 pt-3 text-sm border-t border-white/5">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-white">{posts.length + (pinnedPost ? 1 : 0)}</span>
                    <span className="text-secondary">{t("profile.signals")}</span>
                  </div>
                  <button onClick={() => openFollowModal('followers')} className="flex items-center gap-1 hover:text-white">
                    <span className="font-semibold text-white">{user.followers_count || 0}</span>
                    <span className="text-secondary">{t("profile.followers")}</span>
                  </button>
                  <button onClick={() => openFollowModal('following')} className="flex items-center gap-1 hover:text-white">
                    <span className="font-semibold text-white">{user.following_count || 0}</span>
                    <span className="text-secondary">{t("profile.following")}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Pinned Post */}
      {pinnedPost && (
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2 px-2 text-xs text-secondary">
            <Pin className="h-3 w-3 fill-current" />
            <span>{t("profile.pinned")}</span>
          </div>
          <Post
            id={pinnedPost.id.toString()}
            userId={String(pinnedPost.user_id || pinnedPost.userId)}
            text={pinnedPost.text}
            imageUrl={pinnedPost.image_url || pinnedPost.imageUrl}
            imageUrls={pinnedPost.image_urls || pinnedPost.imageUrls}
            timestamp={pinnedPost.timestamp}
            replies={pinnedPost.replies}
            resonance={pinnedPost.resonance}
            name={pinnedPost.name}
            username={pinnedPost.username}
            avatar={pinnedPost.avatar}
            verified={pinnedPost.verified}
            isPinned={true}
            showPinAction={true}
          />
        </div>
      )}

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
          <h3 className="font-semibold text-white">Signals</h3>
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
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-white/8 mb-3">
              <Calendar className="h-6 w-6 text-white/60" />
            </div>
            <p className="text-white font-medium">No signals yet</p>
            <p className="text-sm text-secondary mt-1">
              {isOwnProfile ? 'Share your first signal!' : 'This user has not posted yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// User List Item Component

export default ProfilePage;
