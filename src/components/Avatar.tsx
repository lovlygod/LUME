import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  allowGif?: boolean;
}

export default function Avatar({ src, alt, size = 'md', className = '', allowGif = true }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const placeholder = `https://ui-avatars.com/api/?name=${encodeURIComponent(alt)}&background=8b5cf6&color=fff&size=128`;

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden bg-[#27272a] flex-shrink-0',
        sizeClasses[size],
        className
      )}
    >
      <img
        src={src || placeholder}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      {allowGif && src?.includes('.gif') && (
        <div className="absolute top-0.5 right-0.5 p-1 bg-black/60 rounded-full" title="GIF Avatar">
          <span className="text-[8px] text-white font-bold">GIF</span>
        </div>
      )}
    </div>
  );
}
