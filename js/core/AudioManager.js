// Synthesized sounds via Web Audio API — no audio files needed
let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function tone({ frequency = 440, type = 'sine', duration = 0.15, gain = 0.3,
                 freqEnd = null, attack = 0.01, decay = 0.05 } = {}) {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const env = ac.createGain();
    osc.connect(env);
    env.connect(ac.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ac.currentTime);
    if (freqEnd !== null) {
      osc.frequency.linearRampToValueAtTime(freqEnd, ac.currentTime + duration);
    }
    env.gain.setValueAtTime(0, ac.currentTime);
    env.gain.linearRampToValueAtTime(gain, ac.currentTime + attack);
    env.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);

    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration + 0.05);
  } catch (_) {}
}

export const AudioManager = {
  shoot() {
    tone({ frequency: 600, freqEnd: 300, type: 'square', duration: 0.08, gain: 0.15 });
  },
  correct() {
    tone({ frequency: 440, freqEnd: 660, type: 'sine', duration: 0.18, gain: 0.35, attack: 0.005 });
    setTimeout(() => tone({ frequency: 880, type: 'sine', duration: 0.15, gain: 0.25 }), 80);
  },
  wrong() {
    tone({ frequency: 200, freqEnd: 100, type: 'sawtooth', duration: 0.25, gain: 0.3 });
  }
};
