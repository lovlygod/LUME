import { useState, useEffect, useRef, useCallback } from 'react';

const EMOJI_DATA_URL = 'https://cdn.jsdelivr.net/npm/emoji-datasource-apple@16.0/emoji.json';
const APPLE_EMOJI_BASE = 'https://cdn.jsdelivr.net/npm/emoji-datasource-apple@16.0/img/apple/64/';

type EmojiItem = {
  name: string;
  unified: string;
  short_name: string;
  short_names: string[];
  category: string;
  image: string;
  sheet_x: number;
  sheet_y: number;
};

const CATEGORIES = [
  { key: 'Smileys & Emotion', icon: '\u{1F600}', label: 'Smileys' },
  { key: 'People & Body', icon: '\u{1F44B}', label: 'People' },
  { key: 'Animals & Nature', icon: '\u{1F436}', label: 'Animals' },
  { key: 'Food & Drink', icon: '\u{1F354}', label: 'Food' },
  { key: 'Travel & Places', icon: '\u{2708}\u{FE0F}', label: 'Travel' },
  { key: 'Activities', icon: '\u{26BD}', label: 'Activities' },
  { key: 'Objects', icon: '\u{1F4A1}', label: 'Objects' },
  { key: 'Symbols', icon: '\u{2764}\u{FE0F}', label: 'Symbols' },
  { key: 'Flags', icon: '\u{1F3C1}', label: 'Flags' },
];

function unifiedToEmoji(unified: string): string {
  return unified
    .split('-')
    .map((cp) => String.fromCodePoint(parseInt(cp, 16)))
    .join('');
}

type EmojiPickerProps = {
  onEmojiClick: (emoji: string) => void;
};

const EmojiPicker = ({ onEmojiClick }: EmojiPickerProps) => {
  const [emojiData, setEmojiData] = useState<EmojiItem[] | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    fetch(EMOJI_DATA_URL)
      .then((res) => res.json())
      .then((data) => setEmojiData(data as EmojiItem[]))
      .catch((err) => console.error('Failed to load emoji data:', err));
  }, []);

  const scrollToCategory = useCallback((index: number) => {
    const ref = categoryRefs.current[index];
    if (ref && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: ref.offsetTop - scrollRef.current.offsetTop,
        behavior: 'smooth',
      });
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const scrollTop = scrollRef.current.scrollTop;
    for (let i = categoryRefs.current.length - 1; i >= 0; i--) {
      const ref = categoryRefs.current[i];
      if (ref && ref.offsetTop - scrollRef.current.offsetTop <= scrollTop + 20) {
        setActiveCategory(i);
        break;
      }
    }
  }, []);

  const handleEmojiClick = (emoji: EmojiItem) => {
    onEmojiClick(unifiedToEmoji(emoji.unified));
  };

  const filteredEmojis = search.trim()
    ? emojiData?.filter(
        (e) =>
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          e.short_names.some((s) => s.includes(search.toLowerCase()))
      ).slice(0, 80)
    : null;

  const groupedEmojis: Record<string, EmojiItem[]> = {};
  if (emojiData) {
    for (const cat of CATEGORIES) {
      groupedEmojis[cat.key] = emojiData.filter((e) => e.category === cat.key);
    }
  }

  if (!emojiData) {
    return (
      <div className="w-72 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl flex items-center justify-center h-48">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      </div>
    );
  }

  return (
    <div
      className="w-72 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col"
      style={{ maxHeight: '340px' }}
      data-emoji-picker
      onClick={(e) => e.stopPropagation()}
    >
      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10">
        <div className="relative flex-1">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
            >
              <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Category bar */}
      {!search && (
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-white/10">
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat.key}
              onClick={() => {
                setActiveCategory(i);
                scrollToCategory(i);
              }}
              className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-smooth ${
                activeCategory === i ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
              title={cat.label}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-2"
        style={{ maxHeight: '250px', overflowY: 'auto' }}
      >
        {search && filteredEmojis?.length === 0 && (
          <div className="text-center text-white/40 text-xs py-6">No results</div>
        )}

        {search
          ? filteredEmojis && (
              <div className="grid grid-cols-8 gap-0.5">
                {filteredEmojis.map((emoji) => (
                  <button
                    key={emoji.unified}
                    onClick={() => handleEmojiClick(emoji)}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-smooth"
                    title={emoji.name}
                  >
                    <img
                      src={`${APPLE_EMOJI_BASE}${emoji.image}`}
                      alt={emoji.name}
                      className="w-6 h-6 object-contain"
                      draggable={false}
                    />
                  </button>
                ))}
              </div>
            )
          : CATEGORIES.map((cat, i) => {
              const emojis = groupedEmojis[cat.key];
              if (!emojis?.length) return null;
              return (
                <div
                  key={cat.key}
                  ref={(el) => {
                    categoryRefs.current[i] = el;
                  }}
                >
                  <div className="text-[10px] font-medium text-white/30 px-1 py-0.5">
                    {cat.label}
                  </div>
                  <div className="grid grid-cols-8 gap-0.5">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji.unified}
                        onClick={() => handleEmojiClick(emoji)}
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-smooth"
                        title={emoji.name}
                      >
                        <img
                          src={`${APPLE_EMOJI_BASE}${emoji.image}`}
                          alt={emoji.name}
                          className="w-6 h-6 object-contain"
                          draggable={false}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
};

export default EmojiPicker;
