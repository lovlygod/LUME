import { useState, useRef, useEffect } from "react";
import { Image, Zap, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { profileAPI, postsAPI } from "@/services/api";
import type { User } from "@/types/api";
import { useAuth, isVerifiedUser } from "@/contexts/AuthContext";
import { normalizeImageUrl } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

const PostComposer = () => {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [posting, setPosting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user: authUser } = useAuth();
  const { t } = useLanguage();

  const refreshPosts = () => {
    window.dispatchEvent(new CustomEvent('refreshPosts'));
  };

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await profileAPI.getCurrentUser();
        setUser(response.user);
      } catch (error) {
        console.error('Failed to load current user:', error);
      }
    };

    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [text]);

  const charCount = text.length;
  const isNearLimit = charCount > 380;
  const canPost = (text.trim() || selectedImage) && !posting;

  const handleSubmit = async () => {
    if (!canPost || !user) return;

    setPosting(true);
    try {
      const postData: { text?: string; image?: File } = {};
      if (text.trim()) {
        postData.text = text;
      }
      if (selectedImage) {
        postData.image = selectedImage;
      }

      await postsAPI.createPost(postData);

      setText('');
      setImagePreview(null);
      setSelectedImage(null);

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      refreshPosts();
    } catch (error) {
      console.error('Failed to post:', error);
    } finally {
      setPosting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const currentUser = user || authUser;

  return (
    <div className={`px-5 py-5 transition-smooth ${isFocused ? 'bg-white/4' : ''}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {currentUser?.avatar ? (
            <img
              src={normalizeImageUrl(currentUser.avatar) || ''}
              alt={currentUser.name}
              className="h-9 w-9 rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '';
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : null}
          {!currentUser?.avatar && (
            <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white">
              {currentUser?.name.charAt(0) || 'U'}
            </div>
          )}
        </div>

        {/* Compose Area */}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={t("feed.signalPlaceholder")}
            className="w-full resize-none border-none bg-transparent text-white placeholder:text-white/35 focus:outline-none focus:ring-0 text-[15px] leading-relaxed"
            rows={1}
          />

          {/* Image Preview */}
          <AnimatePresence>
            {imagePreview && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mt-3 relative inline-block max-w-full"
              >
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-64 rounded-2xl object-cover border border-white/10"
                />
                <motion.button
                  type="button"
                  onClick={removeImage}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute -top-2 -right-2 bg-white/10 rounded-full p-1.5 shadow-lg"
                >
                  <X className="h-3.5 w-3.5 text-white" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <motion.button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-full p-2 text-white/50 hover:bg-white/5 transition-smooth"
              >
                <Image className="h-4 w-4" />
              </motion.button>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Character Counter */}
              {charCount > 0 && (
                <span className={`text-xs font-mono ${isNearLimit ? 'text-red-200' : 'text-white/40'}`}>
                  {charCount}/420
                </span>
              )}

              {/* Post Button */}
              <motion.button
                onClick={handleSubmit}
                disabled={!canPost}
                className="btn-glass"
                whileHover={canPost ? { scale: 1.02 } : {}}
                whileTap={canPost ? { scale: 0.98 } : {}}
              >
                {posting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t("feed.sendingSignal")}</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    <span>{t("feed.sendSignal")}</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostComposer;
