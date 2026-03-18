import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { messagesAPI } from "@/services/api";
import type { Chat } from "@/types/messages";
import { normalizeImageUrl } from "@/lib/utils";
import { Loader } from "@/components/ui/Loader";

export interface SearchResult {
  id: string;
  text: string;
  timestamp: string;
  chatId: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
  };
  contact: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
  } | null;
}

interface MessageSearchProps {
  onResultClick?: (result: SearchResult) => void;
  t: (key: string) => string;
  chats?: Chat[];
}

const DEBOUNCE_DELAY = 300;

export const MessageSearch = ({ onResultClick, t, chats }: MessageSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Поиск с debounce
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await messagesAPI.searchMessages(searchQuery, 50) as { results?: SearchResult[] };
      setResults(data.results || []);
      setIsOpen(true);
    } catch (err) {
      setError(t("messages.searchError"));
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Debounce эффект
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch]);

  // Закрытие при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult, chatMatch?: Chat) => {
    // Переход к чату с сообщением
    const targetChatId = chatMatch?.id || result.chatId;
    if (targetChatId) {
      navigate(`/messages/${targetChatId}`);
    }
    
    // Сохраняем ID сообщения для прокрутки к нему (можно реализовать через context)
    sessionStorage.setItem("highlightMessageId", result.id);
    
    setIsOpen(false);
    setQuery("");
    onResultClick?.(result);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);

    if (hours < 24) {
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-400/30 text-yellow-200 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("messages.searchPlaceholder") || "Поиск сообщений..."}
          className="w-full px-4 py-2.5 pl-11 rounded-[20px] border border-white/10 bg-white/5 text-white placeholder-white/40 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all text-sm"
        />
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader size={20} />
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 rounded-[20px] border border-white/10 bg-black/70 backdrop-blur-[24px] shadow-xl overflow-hidden z-50"
          >
            {error ? (
              <div className="px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : results.length === 0 && query.trim() ? (
              <div className="px-4 py-3 text-sm text-white/60 text-center">
                {t("messages.searchNoResults") || "Ничего не найдено"}
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                {results.map((result) => {
                  const chatMatch = chats?.find((chat) => String(chat.id) === String(result.chatId));

                  return (
                   <button
                     key={result.id}
                    onClick={() => handleResultClick(result, chatMatch)}
                    className="w-full px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-b-0"
                  >
                    <div className="flex items-start gap-3">
                      {/* Аватар контакта */}
                        <img
                          src={normalizeImageUrl(result.user.avatar)}
                          alt={result.user.name}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                      
                      <div className="flex-1 min-w-0">
                        {/* Имя и время */}
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white truncate">
                              {result.user.name}
                            </span>
                            {result.user.verified && (
                              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                                ✓
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-white/40 flex-shrink-0">
                            {formatTimestamp(result.timestamp)}
                          </span>
                        </div>
                        
                        {/* Текст сообщения с подсветкой */}
                        <div className="text-sm text-white/70 line-clamp-2">
                          {highlightText(result.text, query)}
                        </div>
                        
                        {/* Чат */}
                        <div className="mt-1 text-xs text-white/40">
                          {t("messages.inChat") || "В чате"} с{" "}
                          <span className="text-white/60">
                            {chatMatch?.title || result.contact?.name || result.user.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                )})}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
