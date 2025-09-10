import { useCallback, useRef } from 'react';

interface SoundOptions {
  volume?: number;
  playbackRate?: number;
}

export const useSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, options: SoundOptions = {}) => {
    const audioContext = initAudioContext();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(options.volume || 0.1, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }, [initAudioContext]);

  const playJumpSound = useCallback(() => {
    playTone(440, 0.1, { volume: 0.2 });
  }, [playTone]);

  const playScoreSound = useCallback(() => {
    playTone(523, 0.15, { volume: 0.15 });
    setTimeout(() => playTone(659, 0.15, { volume: 0.15 }), 50);
  }, [playTone]);

  const playCollisionSound = useCallback(() => {
    playTone(200, 0.3, { volume: 0.3 });
    setTimeout(() => playTone(150, 0.2, { volume: 0.2 }), 100);
  }, [playTone]);

  const playPowerUpSound = useCallback(() => {
    playTone(330, 0.1, { volume: 0.2 });
    setTimeout(() => playTone(440, 0.1, { volume: 0.2 }), 50);
    setTimeout(() => playTone(554, 0.1, { volume: 0.2 }), 100);
  }, [playTone]);

  const playGameOverSound = useCallback(() => {
    playTone(300, 0.2, { volume: 0.3 });
    setTimeout(() => playTone(250, 0.2, { volume: 0.3 }), 150);
    setTimeout(() => playTone(200, 0.3, { volume: 0.3 }), 300);
  }, [playTone]);

  return {
    playJumpSound,
    playScoreSound,
    playCollisionSound,
    playPowerUpSound,
    playGameOverSound
  };
};
