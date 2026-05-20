import { useState, useEffect } from "react";
import { Download, Copy, AlertCircle, Loader2, Check } from "lucide-react";

interface DiagramMessageProps {
  code: string;
  type?: string;
  diagramSvg?: string | null;
}

export function DiagramMessage({ code, type = "mermaid", diagramSvg: preRenderedSvg }: DiagramMessageProps) {
  const [svg, setSvg] = useState<string | null>(preRenderedSvg || null);
  const [loading, setLoading] = useState(!preRenderedSvg);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (preRenderedSvg) {
      setSvg(preRenderedSvg);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function renderDiagram() {
      try {
        const response = await fetch("/api/diagram/render", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ code, type }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to render diagram");
        }

        const data = await response.json();
        if (cancelled) return;
        setSvg(data.svg);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [code, type, preRenderedSvg]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diagram-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const sanitizeSvg = (svgContent: string) => {
    let sanitized = svgContent
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
      .replace(/javascript:/gi, "");

    if (!sanitized.includes("xmlns")) {
      sanitized = sanitized.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    return sanitized;
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 max-w-full">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[11px] font-semibold tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-lg">
          Diagram
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 transition-colors"
            title="Copy code"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : (
              <Copy className="h-4 w-4 text-white/80" />
            )}
          </button>
          {svg && (
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 transition-colors"
              title="Download SVG"
            >
              {downloaded ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Download className="h-4 w-4 text-white/80" />
              )}
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-white/30" />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 py-4 text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {svg && !loading && (
        <div
          className="overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: sanitizeSvg(svg) }}
        />
      )}
    </div>
  );
}

export function detectDiagramCode(text: string): { isDiagram: boolean; code: string; type: string } {
  const trimmed = text.trim();

  const diagramPatterns = [
    { pattern: /^graph\s+(TD|BT|LR|RL)/i, type: "mermaid" },
    { pattern: /^flowchart\s+(TD|BT|LR|RL)/i, type: "mermaid" },
    { pattern: /^pie\s+/i, type: "mermaid" },
    { pattern: /^gitGraph/i, type: "mermaid" },
  ];

  for (const { pattern, type } of diagramPatterns) {
    if (pattern.test(trimmed)) {
      return { isDiagram: true, code: trimmed, type };
    }
  }

  return { isDiagram: false, code: "", type: "mermaid" };
}