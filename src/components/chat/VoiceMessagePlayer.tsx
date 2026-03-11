import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Play, Pause } from "lucide-react";

interface VoiceMessagePlayerProps {
  audioUrl: string;
  duration?: number;
  timestamp?: string;
  className?: string;
}

const BAR_COUNT = 36;

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatMessageTime = (timestamp?: string): string => {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const seededWaveform = (seed: string, count: number): number[] => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  const bars: number[] = [];
  for (let i = 0; i < count; i += 1) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    const random = hash / 0xffffffff;
    const height = 6 + Math.round(random * 10); // 6..16px
    bars.push(height);
  }
  return bars;
};

const VoiceMessagePlayer = ({ audioUrl, duration, timestamp, className = "" }: VoiceMessagePlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [isLoaded, setIsLoaded] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastPaintTimeRef = useRef(0);

  const bars = useMemo(() => seededWaveform(audioUrl, BAR_COUNT), [audioUrl]);
  const progress = audioDuration > 0 ? Math.min(1, currentTime / audioDuration) : 0;

  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const tick = useCallback(
    (now: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (now - lastPaintTimeRef.current >= 50) {
        setCurrentTime(audio.currentTime);
        lastPaintTimeRef.current = now;
      }

      if (!audio.paused && !audio.ended) {
        rafRef.current = requestAnimationFrame(tick);
      }
    },
    []
  );

  const handleTogglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !isLoaded) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      stopRaf();
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
      lastPaintTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setIsPlaying(false);
    }
  }, [isLoaded, isPlaying, stopRaf, tick]);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!Number.isNaN(audio.duration) && Number.isFinite(audio.duration)) {
      setAudioDuration(audio.duration);
    }
    setIsLoaded(true);
  }, []);

  const handleEnded = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
    }
    setCurrentTime(0);
    setIsPlaying(false);
    stopRaf();
  }, [stopRaf]);

  const handleSeek = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      if (!audio || !isLoaded || audioDuration <= 0) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const ratio = (event.clientX - rect.left) / rect.width;
      const nextTime = Math.max(0, Math.min(audioDuration, ratio * audioDuration));

      audio.currentTime = nextTime;
      setCurrentTime(nextTime);
    },
    [audioDuration, isLoaded]
  );

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      stopRaf();
      if (audio) {
        audio.pause();
      }
    };
  }, [stopRaf]);

  return (
    <div className={`min-w-[260px] ${className}`}>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={handleTogglePlay}
          disabled={!isLoaded}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-white/90 transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={isPlaying ? "Pause voice message" : "Play voice message"}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
        </button>

        <div className="flex flex-1 items-center gap-2">
          <div
            className="flex h-6 flex-1 cursor-pointer items-end gap-[2px]"
            onClick={handleSeek}
            role="slider"
            aria-label="Voice message progress"
            aria-valuemin={0}
            aria-valuemax={Math.max(audioDuration, 0)}
            aria-valuenow={currentTime}
            tabIndex={0}
          >
            {bars.map((height, index) => {
              const threshold = (index + 1) / BAR_COUNT;
              const played = progress >= threshold;
              return (
                <span
                  key={`${index}-${height}`}
                  className={`w-[2px] rounded-full transition-colors ${played ? "bg-white/85" : "bg-white/30"}`}
                  style={{ height: `${height}px` }}
                />
              );
            })}
          </div>

          <span className="w-9 text-right text-[11px] font-medium tabular-nums text-white/65">
            {formatTime(audioDuration || duration || 0)}
          </span>
        </div>
      </div>

      {timestamp ? (
        <div className="mt-1 flex justify-end text-[10px] text-white/45">{formatMessageTime(timestamp)}</div>
      ) : null}
    </div>
  );
};

export default VoiceMessagePlayer;
