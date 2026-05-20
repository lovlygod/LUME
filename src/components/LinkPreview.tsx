import type { LinkPreview as LinkPreviewData } from '@/types/messages';

interface LinkPreviewProps {
  preview: LinkPreviewData;
  className?: string;
}

export default function LinkPreview({ preview, className }: LinkPreviewProps) {
  if (!preview?.url) return null;

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`mt-2 block w-full group ${className || ''}`}
    >
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-smooth hover:border-white/20">
        {preview.imageUrl && (
          <div className="relative w-full h-40 overflow-hidden">
            <img
              src={preview.imageUrl}
              alt=""
              className="h-full w-full object-cover"
              onError={(event) => {
                (event.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="px-4 py-3">
          {preview.title && (
            <div className="text-sm font-medium text-white/90 line-clamp-1 mb-1">
              {preview.title}
            </div>
          )}
          {preview.description && (
            <div className="text-xs text-white/60 line-clamp-2">
              {preview.description}
            </div>
          )}
        </div>
      </div>
    </a>
  );
}
