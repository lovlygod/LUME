import { useState, useMemo, useEffect } from "react";
import { Search, TrendingUp, Users, Radio } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { messagesAPI, searchAPI, postsAPI } from "@/services/api";
import type { User } from "@/types/api";
import { isVerifiedUser, isDeveloper, isDeveloperCrown, VerifiedBadge, DeveloperBadge, DeveloperCrownBadge } from "@/contexts/AuthContext";
import { normalizeImageUrl } from "@/lib/utils";
import { getProfileRoute } from "@/lib/profileRoute";
import { useLanguage } from "@/contexts/LanguageContext";

interface Trend {
  tag: string;
  posts: string;
  color: string;
}

interface TrendPost {
  text?: string;
}

interface PublicChannel {
  id: string;
  title?: string | null;
  username?: string | null;
  avatar?: string | null;
  membersCount?: number;
}


const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<'users' | 'channels'>('users');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [channelResults, setChannelResults] = useState<PublicChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const { t } = useLanguage();

  // Загрузка трендов
  useEffect(() => {
    const loadTrends = async () => {
      try {
        const response = await postsAPI.getUserPosts('home');
        const posts = response.posts.slice(0, 200) as TrendPost[];
        
        const hashtagCount = new Map<string, number>();
        posts.forEach((post) => {
          if (post.text) {
            const hashtags = post.text.match(/#[a-zA-Z0-9_]+/g);
            if (hashtags) {
              hashtags.forEach(tag => {
                const count = hashtagCount.get(tag) || 0;
                hashtagCount.set(tag, count + 1);
              });
            }
          }
        });

        const sortedTags = Array.from(hashtagCount.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tag, count]) => ({
            tag,
            posts: count < 10 ? `${count}` : `${(count / 1000).toFixed(1)}K`,
            color: [
              'from-violet-500 to-purple-500',
              'from-cyan-500 to-blue-500',
              'from-pink-500 to-rose-500',
              'from-amber-500 to-orange-500',
              'from-emerald-500 to-green-500'
            ][hashtagCount.size % 5]
          }));

        setTrends(sortedTags);
      } catch (error) {
        console.error('Failed to load trends:', error);
        setTrends([]);
      } finally {
        setLoadingTrends(false);
      }
    };

    loadTrends();
  }, []);

  // Загрузка рекомендуемых пользователей
  useEffect(() => {
    const loadSuggestedUsers = async () => {
      try {
        const response = await searchAPI.searchUsers('');
        setSuggestedUsers(response.users.slice(0, 5));
      } catch (error) {
        console.error('Failed to load suggested users:', error);
        setSuggestedUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadSuggestedUsers();
  }, []);

  // Поиск пользователей / каналов
  useEffect(() => {
    const runSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setChannelResults([]);
        return;
      }

      setLoading(true);
      try {
        if (searchMode === 'users') {
          const response = await searchAPI.searchUsers(searchQuery);
          setSearchResults(response.users);
          setChannelResults([]);
        } else {
          const response = await messagesAPI.getPublicChannels(searchQuery);
          setChannelResults(response.channels || []);
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Failed to search:', error);
        setSearchResults([]);
        setChannelResults([]);
      } finally {
        setLoading(false);
      }
    };

    runSearch();
  }, [searchQuery, searchMode]);


  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/60 backdrop-blur-md">
        <div className="px-6 py-5">
          <h1 className="text-lg font-semibold text-white">{t("explore.title")}</h1>
          <p className="text-xs text-secondary">{t("explore.subtitle")}</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 pb-6">
        <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <Input
                  type="text"
                  placeholder={searchMode === 'channels' ? t("explore.searchChannels") : t("explore.searchUsers")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-full"
                />
              </div>

          <div className="flex justify-center">
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1.5">
              <button
                type="button"
                onClick={() => setSearchMode('users')}
                className={`relative z-10 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-smooth ${
                  searchMode === 'users' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                {t('explore.users')}
              </button>
              <button
                type="button"
                onClick={() => setSearchMode('channels')}
                className={`relative z-10 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-smooth ${
                  searchMode === 'channels' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                <Radio className="h-3.5 w-3.5" />
                {t('explore.channels')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {searchQuery.trim() ? (
          // Search Results
          <>
            {searchMode === 'users' && searchResults.length === 0 && !loading ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("explore.noUsersFound")} "{searchQuery}"
                </p>
              </div>
            ) : null}
            {searchMode === 'channels' && channelResults.length === 0 && !loading ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {t("explore.noChannelsFound")} "{searchQuery}"
                </p>
              </div>
            ) : null}
            <div className="rounded-[28px] border border-white/10 bg-white/5 py-2 backdrop-blur-[24px]">
              <div className="px-4 py-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  {searchMode === 'channels' ? <Radio className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                  {searchMode === 'channels' ? t("explore.channels") : t("explore.users")}
                </h3>
              </div>
              {loading ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">{t("explore.searching")}</p>
                </div>
              ) : (
                  searchMode === 'users'
                    ? searchResults.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={getProfileRoute(user)}
                      className="flex items-start gap-3 px-4 py-3 rounded-[22px] transition-smooth hover:bg-white/5"
                    >
                      {/* Avatar */}
                      <div className="relative">
                        {user.avatar ? (
                          <img
                            src={normalizeImageUrl(user.avatar) || ''}
                            alt={user.name}
                            className="h-12 w-12 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '';
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : null}
                        {!user.avatar && (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg font-semibold text-white">
                            {user.name.charAt(0)}
                          </div>
                        )}
                        {Boolean(user.verified) && (
                          <div className="absolute -bottom-0.5 -right-0.5">
                            <VerifiedBadge className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white truncate">
                            {user.name}
                          </span>
                          {Boolean(user.verified) && (
                            <VerifiedBadge className="h-4 w-4" />
                          )}
                          {isDeveloperCrown(user.username)
                            ? <DeveloperCrownBadge className="h-4 w-4" />
                            : isDeveloper(user.username) && <DeveloperBadge className="h-4 w-4" />
                          }
                        </div>
                        <p className="text-sm text-secondary">{user.username}</p>
                        <p className="mt-1 text-sm text-white/80 line-clamp-2">
                          {user.bio}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))
                : channelResults.map((channel, index) => (
                  <motion.div
                    key={channel.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={`/messages/${channel.id}`}
                      className="flex items-start gap-3 px-4 py-3 rounded-[22px] transition-smooth hover:bg-white/5"
                    >
                      <div className="relative">
                        {channel.avatar ? (
                          <img
                            src={normalizeImageUrl(channel.avatar) || ''}
                            alt={channel.title || channel.username || 'channel'}
                            className="h-12 w-12 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '';
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : null}
                        {!channel.avatar && (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg font-semibold text-white">
                            {(channel.title || channel.username || 'C').charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white truncate">
                            {channel.title || channel.username || `Channel ${channel.id}`}
                          </span>
                        </div>
                        <p className="text-sm text-secondary">@{channel.username || channel.id}</p>
                        <p className="mt-1 text-sm text-white/60">
                          {t("explore.members", { count: String(channel.membersCount || 0) })}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          </>
        ) : (
          // Default Explore Content
          <>
            {/* Trending Signals */}
            <div className="rounded-[28px] border border-white/10 bg-white/5 py-2 backdrop-blur-[24px]">
              <div className="px-4 py-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {t("explore.trending")}
                </h3>
              </div>
              {loadingTrends ? (
                <div className="px-4 py-8 text-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-transparent mx-auto" />
                </div>
              ) : trends.length > 0 ? (
                trends.map((trend, index) => (
                  <motion.div
                    key={trend.tag}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="px-4 py-3 rounded-[22px] hover:bg-white/5 transition-smooth cursor-pointer"
                  >
                    <p className="text-sm font-medium text-white">
                      {trend.tag}
                    </p>
                    <p className="text-xs text-secondary">{trend.posts} {t("explore.signals")}</p>
                  </motion.div>
                ))
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-secondary">{t("explore.noTrendingSignals")}</p>
                </div>
              )}
            </div>

            {/* Suggested Users */}
            <div className="rounded-[28px] border border-white/10 bg-white/5 py-2 backdrop-blur-[24px]">
              <div className="px-4 py-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  {t("explore.suggestedNodes")}
                </h3>
              </div>
              {loadingUsers ? (
                <div className="px-4 py-8 text-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
                </div>
              ) : suggestedUsers.length > 0 ? (
                suggestedUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={getProfileRoute(user)}
                      className="flex items-center gap-3 px-4 py-3 rounded-[22px] transition-smooth hover:bg-white/5"
                    >
                      <div className="relative">
                        {user.avatar ? (
                          <img
                            src={normalizeImageUrl(user.avatar) || ''}
                            alt={user.name}
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '';
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : null}
                        {!user.avatar && (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
                            {user.name.charAt(0)}
                          </div>
                        )}
                        {Boolean(user.verified) && (
                          <div className="absolute -bottom-0.5 -right-0.5">
                            <VerifiedBadge className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-white truncate">
                            {user.name}
                          </span>
                          {Boolean(user.verified) && (
                            <VerifiedBadge className="h-3.5 w-3.5" />
                          )}
                          {isDeveloperCrown(user.username)
                            ? <DeveloperCrownBadge className="h-3.5 w-3.5" />
                            : isDeveloper(user.username) && <DeveloperBadge className="h-3.5 w-3.5" />
                          }
                        </div>
                        <p className="text-xs text-secondary">{user.username}</p>
                      </div>
                        <motion.button
                          className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white transition-smooth"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                        {t("explore.connect")}
                      </motion.button>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">{t("explore.noSuggestedNodes")}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Explore;
