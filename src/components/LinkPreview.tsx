import { ExternalLink, Link } from 'lucide-react';
import type { LinkPreview as LinkPreviewData } from '@/types/messages';

interface LinkPreviewProps {
  preview: LinkPreviewData;
  className?: string;
}

const fallbackTitle = (preview: LinkPreviewData) => preview.title || preview.siteName || preview.domain || preview.url;

export default function LinkPreview({ preview, className }: LinkPreviewProps) {
  if (!preview?.url) return null;

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`mt-2 block w-full group ${className || ''}`}
    >
      <div className="overflow-hidden rounded-[20px] border border-white/10 bg-white/5 backdrop-blur-xl transition-smooth hover:border-white/20">
        {preview.imageUrl && (
          <div className="relative w-full max-h-[200px] overflow-hidden">
            <img
              src={preview.imageUrl}
              alt={fallbackTitle(preview)}
              className="h-full w-full object-cover"
              onError={(event) => {
                (event.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute top-3 right-3 rounded-full border border-white/10 bg-black/40 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white/80">
              Preview
            </div>
          </div>
        )}

        <div className="px-4 py-3 space-y-1">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] uppercase tracking-[0.2em] text-white/50">
              {preview.siteName || preview.domain}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-white/50">
              <ExternalLink className="h-3 w-3" />
              <span className="truncate max-w-[120px]">{preview.domain}</span>
            </div>
          </div>

          <div className="text-sm font-semibold text-white/90 line-clamp-1">
            {fallbackTitle(preview)}
          </div>

          {preview.description && (
            <div className="text-xs text-white/60 line-clamp-2">
              {preview.description}
            </div>
          )}

          {!preview.description && (
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Link className="h-3.5 w-3.5" />
              <span className="truncate">{preview.url}</span>
            </div>
          )}
        </div>
      </div>
    </a>
  );
}
