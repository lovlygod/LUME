import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, QrCode } from 'lucide-react';
import QRCodeStyling from 'qr-code-styling';
import { useLanguage } from '@/contexts/LanguageContext';

type QRCodeModalProps = {
  open: boolean;
  onClose: () => void;
  data: string;
  username?: string;
  avatarUrl?: string;
};

const QR_CODE_SIZE = 260;

const qrCode = new QRCodeStyling({
  width: QR_CODE_SIZE,
  height: QR_CODE_SIZE,
  type: 'svg',
  data: '',
  image: '',
  dotsOptions: {
    color: '#ffffff',
    type: 'rounded',
  },
  backgroundOptions: {
    color: 'transparent',
  },
  imageOptions: {
    crossOrigin: 'anonymous',
    margin: 10,
    imageSize: 0.35,
  },
  cornersSquareOptions: {
    color: '#ffffff',
    type: 'extra-rounded',
  },
  cornersDotOptions: {
    color: '#ffffff',
    type: 'dot',
  },
});

const QRCodeModal = ({ open, onClose, data, username, avatarUrl }: QRCodeModalProps) => {
  const { t } = useLanguage();
  const qrRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!open || !data) return;

    setIsLoading(true);

    qrCode.update({
      data,
      image: avatarUrl || '',
    });

    if (qrRef.current) {
      qrRef.current.innerHTML = '';
      qrCode.append(qrRef.current);
      
      setTimeout(() => setIsLoading(false), 100);
    }
  }, [open, data, avatarUrl]);

  const handleDownload = () => {
    qrCode.download({
      extension: 'png',
      name: `lume-qr-${username || 'profile'}`,
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${username}'s LUME Profile`,
          url: data,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(data);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-md glass-panel rounded-3xl overflow-hidden no-hover-lift"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-white/70" />
                  <h3 className="font-semibold text-white">{t("profile.qrCode") || "QR Code"}</h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-smooth"
                >
                  <X className="h-4 w-4 text-white/70" />
                </button>
              </div>

              {/* QR Code */}
              <div className="flex justify-center items-center py-6">
                <div className="relative">
                  <div
                    ref={qrRef}
                    className="flex items-center justify-center"
                    style={{ width: QR_CODE_SIZE, height: QR_CODE_SIZE }}
                  />
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Username */}
              {username && (
                <p className="text-center text-sm text-secondary mb-4">
                  @{username}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3 px-4 pb-4">
                <button
                  onClick={handleDownload}
                  className="btn-glass flex-1 flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>{t("common.save") || "Save"}</span>
                </button>
                <button
                  onClick={handleShare}
                  className="btn-glass flex-1 flex items-center justify-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  <span>{navigator.share ? (t("common.share") || "Share") : (t("common.copyLink") || "Copy Link")}</span>
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default QRCodeModal;
