import sendSoundUrl from "@/assets/sounds/message-send.mp3";
import receiveSoundUrl from "@/assets/sounds/message_incoming.mp3";

const SEND_VOLUME = 0.24;
const RECEIVE_VOLUME = 0.28;
const MIN_GAP_MS = 120;

const createAudio = (src: string, volume: number): HTMLAudioElement => {
  const audio = new Audio(src);
  audio.preload = "auto";
  audio.volume = volume;
  return audio;
};

const sendAudio = createAudio(sendSoundUrl, SEND_VOLUME);
const receiveAudio = createAudio(receiveSoundUrl, RECEIVE_VOLUME);

let lastSendAt = 0;
let lastReceiveAt = 0;

const tryPlay = (audio: HTMLAudioElement) => {
  audio.currentTime = 0;
  void audio.play().catch(() => {
    // Ignore autoplay/browser policy errors.
  });
};

export const messageSounds = {
  playSend() {
    const now = Date.now();
    if (now - lastSendAt < MIN_GAP_MS) return;
    lastSendAt = now;
    tryPlay(sendAudio);
  },
  playReceive() {
    const now = Date.now();
    if (now - lastReceiveAt < MIN_GAP_MS) return;
    lastReceiveAt = now;
    tryPlay(receiveAudio);
  },
};
