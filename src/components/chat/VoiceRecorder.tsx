import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Play, Pause, Send, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface VoiceRecorderProps {
  onSendVoice: (blob: Blob, duration: number) => void;
  t: (key: string) => string;
}

const MAX_RECORDING_DURATION = 60; // СЃРµРєСѓРЅРґ
const WAVEFORM_BARS = 36; // РєРѕР»РёС‡РµСЃС‚РІРѕ РїРѕР»РѕСЃ РІРѕР»РЅС‹

const VoiceRecorder = ({ onSendVoice, t }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [amplitudes, setAmplitudes] = useState<number[]>([]);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isSending, setIsSending] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const recordingTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  // РћС‡РёСЃС‚РєР° СЂРµСЃСѓСЂСЃРѕРІ
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = '';
      audioPlayerRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    analyserRef.current = null;
    dataArrayRef.current = null;
  }, []);

  // РЎР±СЂРѕСЃ СЃРѕСЃС‚РѕСЏРЅРёСЏ
  const resetRecording = useCallback(() => {
    cleanup();
    setIsRecording(false);
    setIsPreview(false);
    setRecordingTime(0);
    setAudioBlob(null);
    setAudioDuration(0);
    setAmplitudes([]);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    chunksRef.current = [];
    mediaRecorderRef.current = null;
  }, [audioUrl, cleanup]);

  // РћР±РЅРѕРІР»РµРЅРёРµ РІСЂРµРјРµРЅРё Р·Р°РїРёСЃРё
  const updateTime = useCallback(() => {
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const next = Math.min(elapsed, MAX_RECORDING_DURATION);
    recordingTimeRef.current = next;
    setRecordingTime(next);
  }, []);

  // РђРЅР°Р»РёР· Р°РјРїР»РёС‚СѓРґС‹ Р°СѓРґРёРѕ РІ СЂРµР°Р»СЊРЅРѕРј РІСЂРµРјРµРЅРё
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    analyserRef.current.getByteTimeDomainData(dataArrayRef.current as Uint8Array<ArrayBuffer>);

    // RMS по time-domain заметно лучше реагирует на реальный голос.
    let sumSquares = 0;
    const length = dataArrayRef.current.length;
    for (let i = 0; i < length; i++) {
      const centered = (dataArrayRef.current[i] - 128) / 128;
      sumSquares += centered * centered;
    }
    const rms = Math.sqrt(sumSquares / length);
    const normalizedAmplitude = Math.max(0.04, Math.min(1, rms * 3.5));
    
    setAmplitudes(prev => {
      const newAmplitudes = [...prev, normalizedAmplitude];
      // РћРіСЂР°РЅРёС‡РёРІР°РµРј РєРѕР»РёС‡РµСЃС‚РІРѕ СЃРѕС…СЂР°РЅРµРЅРЅС‹С… Р·РЅР°С‡РµРЅРёР№
      if (newAmplitudes.length > WAVEFORM_BARS) {
        return newAmplitudes.slice(newAmplitudes.length - WAVEFORM_BARS);
      }
      return newAmplitudes;
    });

    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  }, []);

  // РќР°С‡Р°Р»Рѕ Р·Р°РїРёСЃРё
  const startRecording = useCallback(async () => {
    // Р—Р°Р±РѕСЂРѕРЅСЏС”РјРѕ РїРѕРІС‚РѕСЂРЅРёР№ Р·Р°РїСѓСЃРє СЏРєС‰Рѕ РІР¶Рµ Р·Р°РїРёСЃСѓС”РјРѕ
    if (isRecording || isPreview) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      // Р’С‹Р±РёСЂР°РµРј РїРѕРґРґРµСЂР¶РёРІР°РµРјС‹Р№ MIME С‚РёРї
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];

      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType || 'audio/webm',
        audioBitsPerSecond: 128000,
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setAmplitudes([]);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalDuration = Math.min(
          MAX_RECORDING_DURATION,
          Math.max(recordingTimeRef.current, Math.floor((Date.now() - startTimeRef.current) / 1000))
        );
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        if (blob.size === 0) {
          setIsStopping(false);
          setIsRecording(false);
          toast.error(t("voice.recordEmpty") || "Запись не получилась, попробуйте ещё раз");
          return;
        }
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setIsPreview(true);
        setIsRecording(false);
        setIsStopping(false);
        setAudioDuration(finalDuration);
        setRecordingTime(finalDuration);
        cleanup();

        // РћСЃС‚Р°РЅР°РІР»РёРІР°РµРј РІСЃРµ С‚СЂРµРєРё РїРѕС‚РѕРєР°
        stream.getTracks().forEach(track => track.stop());
      };

      // РќР°СЃС‚СЂР°РёРІР°РµРј AudioContext РґР»СЏ Р°РЅР°Р»РёР·Р°
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 512;
      analyserRef.current.smoothingTimeConstant = 0.65;
      
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      
      const buffer = new ArrayBuffer(analyserRef.current.frequencyBinCount);
      dataArrayRef.current = new Uint8Array<ArrayBuffer>(buffer);

      mediaRecorder.start(100);
      setIsRecording(true);
      setIsStopping(false);
      setRecordingTime(0);
      recordingTimeRef.current = 0;
      setAudioDuration(0);
      startTimeRef.current = Date.now();

      // Р—Р°РїСѓСЃРєР°РµРј Р°РЅР°Р»РёР· Р°СѓРґРёРѕ
      analyzeAudio();

      // Р—Р°РїСѓСЃРєР°РµРј С‚Р°Р№РјРµСЂ
      timerRef.current = setInterval(() => {
        updateTime();

        // РђРІС‚РѕРјР°С‚РёС‡РµСЃРєР°СЏ РѕСЃС‚Р°РЅРѕРІРєР° РїРѕ РґРѕСЃС‚РёР¶РµРЅРёРё Р»РёРјРёС‚Р°
        if (recordingTimeRef.current >= MAX_RECORDING_DURATION - 1) {
          stopRecording();
        }
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error(t("voice.microphoneError") || "Не удалось получить доступ к микрофону");
    }
  }, [isRecording, isPreview, updateTime, analyzeAudio, t]);

  // РћСЃС‚Р°РЅРѕРІРєР° Р·Р°РїРёСЃРё
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isStopping) {
      setIsStopping(true);
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.requestData();
      }
      mediaRecorderRef.current.stop();

      // Stop live recording visuals immediately; preview is prepared in onstop.
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, [isRecording, isStopping]);

  // Р’РѕСЃРїСЂРѕРёР·РІРµРґРµРЅРёРµ РїСЂРµРІСЊСЋ
  const togglePlayback = useCallback(() => {
    if (!audioUrl || !audioBlob) return;

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = '';
      audioPlayerRef.current = null;
      setIsPlaying(false);
      return;
    }

    const audio = new Audio(audioUrl);
    audioPlayerRef.current = audio;

    audio.onloadedmetadata = () => {
      setAudioDuration(audio.duration);
    };

    audio.onended = () => {
      setIsPlaying(false);
      audioPlayerRef.current = null;
      setRecordingTime(0);
    };

    audio.onerror = () => {
      setIsPlaying(false);
      audioPlayerRef.current = null;
    };

    audio.play();
    setIsPlaying(true);
  }, [audioUrl, audioBlob]);

  // РћС‚РїСЂР°РІРєР° РіРѕР»РѕСЃРѕРІРѕРіРѕ СЃРѕРѕР±С‰РµРЅРёСЏ
  const handleSend = useCallback(async () => {
    if (audioBlob && !isSending) {
      setIsSending(true);
      try {
        await onSendVoice(audioBlob, audioDuration || recordingTime);
        resetRecording();
      } catch (error) {
        console.error('Error sending voice:', error);
      } finally {
        setIsSending(false);
      }
    }
  }, [audioBlob, audioDuration, recordingTime, isSending, onSendVoice, resetRecording]);

  // РћС‚РјРµРЅР° Р·Р°РїРёСЃРё/РїСЂРµРІСЊСЋ
  const handleCancel = useCallback(() => {
    resetRecording();
  }, [resetRecording]);

  // Р¤РѕСЂРјР°С‚РёСЂРѕРІР°РЅРёРµ РІСЂРµРјРµРЅРё
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // РћС‡РёСЃС‚РєР° РїСЂРё СЂР°Р·РјРѕРЅС‚РёСЂРѕРІР°РЅРёРё
  useEffect(() => {
    return () => {
      cleanup();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl, cleanup]);

  // РћР±РЅРѕРІР»РµРЅРёРµ РІСЂРµРјРµРЅРё РІ СЂРµР¶РёРјРµ РїСЂРµРІСЊСЋ
  useEffect(() => {
    if (isPlaying && audioPlayerRef.current) {
      const updateProgress = () => {
        if (audioPlayerRef.current) {
          const currentTime = Math.floor(audioPlayerRef.current.currentTime);
          if (currentTime !== recordingTime) {
            setRecordingTime(currentTime);
          }
          animationFrameRef.current = requestAnimationFrame(updateProgress);
        }
      };
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, recordingTime]);

  return (
    <div className="flex items-center gap-2">
      <AnimatePresence mode="wait">
        {!isRecording && !isPreview && (
          <motion.button
            key="record"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={startRecording}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/6 text-white/80 hover:bg-white/12 transition-smooth"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={t("voice.record") || "Записать голосовое сообщение"}
          >
            <Mic className="h-5 w-5" />
          </motion.button>
        )}

        {isRecording && (
          <motion.div
            key="recording"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2 flex-1"
          >
            {/* Р’РёР·СѓР°Р»РёР·Р°С†РёСЏ Р·Р°РїРёСЃРё */}
            <div className="flex flex-1 items-center gap-2">
              {/* Р’РѕР»РЅС‹ Р·Р°РїРёСЃРё - СЂРµР°РіРёСЂСѓСЋС‚ РЅР° СЂРµР°Р»СЊРЅС‹Р№ РіРѕР»РѕСЃ */}
              <div className="flex h-6 flex-1 items-end gap-[2px] overflow-hidden">
                {Array.from({ length: WAVEFORM_BARS }).map((_, i) => {
                  const amplitudeIndex = i - (WAVEFORM_BARS - amplitudes.length);
                  const amplitude = amplitudeIndex >= 0 && amplitudeIndex < amplitudes.length
                    ? amplitudes[amplitudeIndex]
                    : 0.05;

                  const height = 4 + amplitude * 20; // 4..24px

                  return (
                    <motion.span
                      key={i}
                      className="w-[2px] rounded-full bg-white/80"
                      style={{ height: `${height}px`, opacity: 0.5 + amplitude * 0.5 }}
                      transition={{ duration: 0.1 }}
                    />
                  );
                })}
              </div>

              {/* РўР°Р№РјРµСЂ */}
              <span className="w-9 text-right text-[11px] font-medium tabular-nums text-white/65">
                {formatTime(recordingTime)}
              </span>
            </div>

            {/* РљРЅРѕРїРєР° РѕСЃС‚Р°РЅРѕРІРєРё */}
            <motion.button
              onClick={stopRecording}
              disabled={isStopping}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/90 transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isStopping ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Square className="h-5 w-5" />
              )}
            </motion.button>

            {/* РљРЅРѕРїРєР° РѕС‚РјРµРЅС‹ */}
            <motion.button
              onClick={handleCancel}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/6 text-white/60 hover:bg-white/12 transition-smooth"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <X className="h-5 w-5" />
            </motion.button>
          </motion.div>
        )}

        {isPreview && audioUrl && (
          <motion.div
            key="preview"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2 flex-1"
          >
            {/* РљРЅРѕРїРєР° play/pause */}
            <motion.button
              onClick={togglePlayback}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/90 transition-colors hover:bg-white/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </motion.button>

            {/* Waveform РїСЂРµРІСЊСЋ - РЅР° РѕСЃРЅРѕРІРµ Р·Р°РїРёСЃР°РЅРЅС‹С… Р°РјРїР»РёС‚СѓРґ */}
            <div className="flex h-6 flex-1 items-end gap-[2px] overflow-hidden">
              {Array.from({ length: WAVEFORM_BARS }).map((_, i) => {
                const amplitudeIndex = i - (WAVEFORM_BARS - amplitudes.length);
                const amplitude = amplitudeIndex >= 0 && amplitudeIndex < amplitudes.length
                  ? amplitudes[amplitudeIndex]
                  : Math.sin(i * 0.3) * 0.3 + 0.3; // fallback РІРѕР»РЅР°
                
                const height = 6 + amplitude * 10; // 6..16px
                
                // РџСЂРѕРіСЂРµСЃСЃ РІРѕСЃРїСЂРѕРёР·РІРµРґРµРЅРёСЏ
                const progress = audioDuration > 0 ? recordingTime / audioDuration : 0;
                const isPast = (i / WAVEFORM_BARS) <= progress;
                
                return (
                  <motion.span
                    key={i}
                    className={`w-[2px] rounded-full transition-colors ${
                      isPast 
                        ? 'bg-white/85' 
                        : 'bg-white/30'
                    }`}
                    style={{ height: `${height}px` }}
                    animate={isPlaying && isPast ? {
                      scaleY: [1, 1.2, 1],
                    } : {}}
                    transition={{
                      repeat: isPlaying && isPast ? Infinity : 0,
                      duration: 0.5,
                      delay: i * 0.02,
                    }}
                  />
                );
              })}
            </div>

            {/* Р”Р»РёС‚РµР»СЊРЅРѕСЃС‚СЊ */}
            <span className="text-xs text-white/60 w-10 text-right">
              {formatTime(recordingTime)}
            </span>

            {/* РљРЅРѕРїРєР° РѕС‚РїСЂР°РІРєРё */}
            <motion.button
              onClick={handleSend}
              disabled={isSending}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/90 transition-colors hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={isSending ? {} : { scale: 1.05 }}
              whileTap={isSending ? {} : { scale: 0.95 }}
              title={t("voice.send") || "Отправить"}
            >
              {isSending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </motion.button>

            {/* РљРЅРѕРїРєР° СѓРґР°Р»РµРЅРёСЏ */}
            <motion.button
              onClick={handleCancel}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={t("voice.delete") || "Удалить"}
            >
              <Trash2 className="h-4 w-4" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceRecorder;
