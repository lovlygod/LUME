import { useEffect, useState } from "react";
import { Package, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface NpmPackageData {
  name: string;
  version: string;
  description: string | null;
  url: string | null;
}

interface NpmPackageCardProps {
  packageName: string;
  className?: string;
}

export function NpmPackageCard({ packageName, className }: NpmPackageCardProps) {
  const [data, setData] = useState<NpmPackageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchPackage = async () => {
      try {
        const response = await fetch(`/api/npm/${encodeURIComponent(packageName)}`, {
          credentials: "include",
        });

        if (!response.ok) {
          if (!cancelled) {
            setError(true);
            setLoading(false);
          }
          return;
        }

        const result = await response.json();
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    };

    fetchPackage();

    return () => {
      cancelled = true;
    };
  }, [packageName]);

  if (loading) {
    return (
      <div className={cn("rounded-xl border border-white/10 bg-white/5 p-4", className)}>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="mt-3 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-3/4" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={cn("rounded-xl border border-white/10 bg-white/5 p-4", className)}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
            <Package className="h-5 w-5 text-white/50" />
          </div>
          <div>
            <p className="font-medium text-white/70">{packageName}</p>
            <p className="text-sm text-white/40">Package not found</p>
          </div>
        </div>
      </div>
    );
  }

  const packageUrl = data.url || `https://www.npmjs.com/package/${data.name}`;

  return (
    <a
      href={packageUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group block rounded-xl border border-white/10 bg-white/5 p-4 transition-all duration-200",
        "hover:border-white/20 hover:bg-white/10 hover:shadow-lg hover:shadow-white/5",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
          <Package className="h-5 w-5 text-blue-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white truncate">{data.name}</p>
          <p className="text-sm text-white/50">v{data.version}</p>
        </div>
        <ExternalLink className="h-4 w-4 flex-shrink-0 text-white/30 transition-colors group-hover:text-white/60" />
      </div>
      
      {data.description && (
        <p className="mt-3 line-clamp-2 text-sm text-white/60">
          {data.description}
        </p>
      )}
    </a>
  );
}