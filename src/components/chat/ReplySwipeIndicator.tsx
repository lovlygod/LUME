import React from 'react';

interface ReplySwipeIndicatorProps {
  dragX: number;
  threshold: number;
}

export const ReplySwipeIndicator: React.FC<ReplySwipeIndicatorProps> = ({ dragX, threshold }) => {
  const normalized = Math.min(dragX / Math.max(threshold, 1), 1);
  const opacity = Math.max(0, Math.min(normalized, 1));
  const offset = Math.min(dragX, threshold);

  return (
    <div
      className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs font-medium text-white/80"
      style={{
        opacity,
        transform: `translate(${offset}px, -50%)`,
      }}
    >
      <span className="mr-1">↩</span>
      Reply
    </div>
  );
};
