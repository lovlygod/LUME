import { useEffect, useState, useRef } from "react";
import { postsAPI } from "@/services/api";
import type { Post as PostType } from "@/types";
import { wsService } from "@/services/websocket";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, RefreshCw, TrendingUp, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import Post from "@/components/post/Post";
import PostComposer from "@/components/feed/PostComposer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { queryKeys } from "@/lib/queryClient";
import { Loader } from "@/components/ui/Loader";

type FeedTab = "recommended" | "following";

const Index = () => {
  const { t } = useLanguage();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [activeTab, setActiveTab] = useState<FeedTab>("recommended");
  const hasLoadedInitial = useRef(false);
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const feedRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: queryKeys.posts.list(activeTab),
    queryFn: ({ signal }) =>
      activeTab === "recommended"
        ? postsAPI.getRecommendedPosts(signal)
        : postsAPI.getFollowingPosts(signal),
    staleTime: 5 * 60 * 1000,
  });

  const posts = data?.posts || [];

  useEffect(() => {
    // Обработчик события обновления главной страницы
    const handleRefreshHome = () => {
      const mainElement = document.querySelector('main.overflow-y-auto');
      if (mainElement) {
        mainElement.scrollTo({ top: 0, behavior: "smooth" });
      }
      hasLoadedInitial.current = false;
      refetch();
    };

    window.addEventListener("refreshHome", handleRefreshHome);

    // Автообновление каждые 30 секунд
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        refetch();
      }
    }, 30000);

    // Подписка на WebSocket события
    const unsubscribeNewPost = wsService.on('new_post', (newPost: PostType) => {
      queryClient.setQueryData<{ posts: PostType[] }>(
        queryKeys.posts.list(activeTab),
        (old) => {
          const existing = old?.posts || [];
          const exists = existing.some(p => p.id === newPost.id);
          if (!exists) {
            setNewPostsCount(prev => prev + 1);
            setTimeout(() => {
              queryClient.setQueryData<{ posts: PostType[] }>(
                queryKeys.posts.list(activeTab),
                (current) => {
                  const currentPosts = current?.posts || [];
                  const currentExists = currentPosts.some(p => p.id === newPost.id);
                  if (currentExists) return current;
                  return { posts: [newPost, ...currentPosts] };
                }
              );
              setNewPostsCount(prev => Math.max(0, prev - 1));
            }, 3000);
          }
          return old;
        }
      );
    });

    const unsubscribeResonance = wsService.on('post_resonance_updated', (data: { postId: string; resonance: number; liked: boolean }) => {
      queryClient.setQueryData<{ posts: PostType[] }>(
        queryKeys.posts.list(activeTab),
        (old) => {
          if (!old?.posts) return old;
          return {
            posts: old.posts.map(post =>
              post.id === data.postId
                ? { ...post, resonance: data.resonance }
                : post
            )
          };
        }
      );
    });

    const unsubscribeNewComment = wsService.on('new_comment', (comment: { postId: string | number }) => {
      queryClient.setQueryData<{ posts: PostType[] }>(
        queryKeys.posts.list(activeTab),
        (old) => {
          if (!old?.posts) return old;
          return {
            posts: old.posts.map(post =>
              post.id === comment.postId
                ? { ...post, replies: (post.replies || 0) + 1 }
                : post
            )
          };
        }
      );
    });

    return () => {
      clearInterval(intervalId);
      unsubscribeNewPost();
      unsubscribeResonance();
      unsubscribeNewComment();
      window.removeEventListener("refreshHome", handleRefreshHome);
    };
  }, [refetch, queryClient, activeTab]);

  useEffect(() => {
    const postId = searchParams.get('post');
    if (!postId) return;

    const attemptScroll = () => {
      const selector = `[data-post-id="${postId}"]`;
      const node = feedRef.current?.querySelector(selector) || document.querySelector(selector);
      if (!node) return false;
      node.scrollIntoView({ behavior: "smooth", block: "center" });
      node.classList.add('ring-1', 'ring-white/40', 'shadow-[0_0_0_1px_rgba(255,255,255,0.16)]');
      window.setTimeout(() => {
        node.classList.remove('ring-1', 'ring-white/40', 'shadow-[0_0_0_1px_rgba(255,255,255,0.16)]');
      }, 2200);
      return true;
    };

    if (attemptScroll()) return;
    const timeout = window.setTimeout(() => {
      attemptScroll();
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [searchParams, posts]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  if (isLoading || (!hasLoadedInitial.current && isFetching)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size={120} />
      </div>
    );
  }

  return (
    <div className="py-7" ref={feedRef}>
      {/* Header with Tabs */}
      <div className="mb-6 rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-[24px]">
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            {activeTab === "recommended" ? (
              <TrendingUp className="h-5 w-5 text-secondary" />
            ) : (
              <Users className="h-5 w-5 text-secondary" />
            )}
            <div>
              <h1 className="text-lg font-semibold text-white">
                {activeTab === "recommended" ? t("feed.recommended") : t("feed.following")}
              </h1>
              <p className="text-xs text-secondary">
                {activeTab === "recommended" ? t("feed.recommendedSubtitle") : t("feed.followingSubtitle")}
              </p>
            </div>
          </div>
          <motion.button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="rounded-full p-2 hover:bg-white/5 transition-smooth"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw className={`h-5 w-5 text-secondary ${isRefreshing ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>

        {/* Tabs */}
        <div className="px-5 pb-5">
          <div className="flex gap-2 rounded-full border border-white/12 bg-white/5 p-1.5">
            <button
              onClick={() => {
                setActiveTab("recommended");
                hasLoadedInitial.current = false;
                refetch();
              }}
              className={`flex-1 rounded-full py-2.5 text-sm font-medium transition-smooth ${
                activeTab === "recommended" ? "bg-white/10 text-white" : "text-secondary hover:text-white"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>{t("feed.forYou")}</span>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab("following");
                hasLoadedInitial.current = false;
                refetch();
              }}
              className={`flex-1 rounded-full py-2.5 text-sm font-medium transition-smooth ${
                activeTab === "following" ? "bg-white/10 text-white" : "text-secondary hover:text-white"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Users className="h-4 w-4" />
                <span>{t("feed.following")}</span>
              </div>
            </button>
          </div>
        </div>

        {/* New Posts Notification */}
        <AnimatePresence>
          {newPostsCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="px-6 py-3.5 bg-white/5"
            >
              <div className="flex items-center justify-center gap-2 text-sm text-white">
                <Zap className="h-4 w-4" />
                <span>{newPostsCount} {newPostsCount === 1 ? t("feed.newPost") : t("feed.newPosts")}</span>
                <button
                  onClick={() => {
                    refetch();
                    setNewPostsCount(0);
                  }}
                  className="underline font-medium"
                >
                  {t("feed.viewNow")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Post Composer */}
      <div className="mb-6 rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-[24px]">
        <PostComposer />
      </div>

      {/* Posts Feed */}
      <div className="space-y-[16px]">
        {posts.length > 0 ? (
          posts.map((post) => (
              <Post
                key={post.id}
                id={post.id.toString()}
                dataPostId={post.id.toString()}
                userId={String(post.userId)}
                text={post.text}
                imageUrl={post.imageUrl}
                imageUrls={post.imageUrls}
                timestamp={post.timestamp}
                replies={post.replies}
                resonance={post.resonance}
                name={post.name}
                username={post.username}
              avatar={post.avatar}
              verified={post.verified}
            />
          ))
        ) : (
          <div className="px-4 py-16 text-center">
            <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium text-foreground">{t("feed.noSignals")}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("feed.firstSignal")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;

