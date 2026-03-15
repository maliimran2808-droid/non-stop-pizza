'use client';

let audioContext: AudioContext | null = null;

export const playNotificationSound = () => {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const duration = 0.15;
    const times = 3;

    for (let i = 0; i < times; i++) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = i % 2 === 0 ? 880 : 1100;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + i * (duration + 0.1));
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + i * (duration + 0.1) + duration
      );

      oscillator.start(audioContext.currentTime + i * (duration + 0.1));
      oscillator.stop(audioContext.currentTime + i * (duration + 0.1) + duration);
    }
  } catch (err) {
    console.log('Sound not supported');
  }
};

// Continuous alarm for unread orders
let alarmInterval: NodeJS.Timeout | null = null;

export const startAlarm = () => {
  if (alarmInterval) return;
  playNotificationSound();
  alarmInterval = setInterval(() => {
    playNotificationSound();
  }, 5000);
};

export const stopAlarm = () => {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
};