let ctx = null;
let _muted = false;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function tone({ frequency = 440, type = 'sine', duration = 0.15, gain = 0.3,
                freqEnd = null, attack = 0.01, decay = 0.05 } = {}) {
  if (_muted) return;
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
  setMuted(val) { _muted = !!val; },
  isMuted()     { return _muted; },

  shoot() {
    tone({ frequency: 600, freqEnd: 300, type: 'square', duration: 0.08, gain: 0.15 });
  },
  correct() {
    tone({ frequency: 440, freqEnd: 660, type: 'sine', duration: 0.18, gain: 0.35, attack: 0.005 });
    setTimeout(() => tone({ frequency: 880, type: 'sine', duration: 0.15, gain: 0.25 }), 80);
  },
  wrong() {
    tone({ frequency: 200, freqEnd: 100, type: 'sawtooth', duration: 0.25, gain: 0.3 });
  },
  powerup() {
    tone({ frequency: 500, freqEnd: 900, type: 'sine', duration: 0.3, gain: 0.3, attack: 0.02 });
    setTimeout(() => tone({ frequency: 1100, type: 'sine', duration: 0.15, gain: 0.2 }), 150);
  },
  freeze() {
    tone({ frequency: 800, freqEnd: 1400, type: 'sine', duration: 0.25, gain: 0.25, attack: 0.01 });
    setTimeout(() => tone({ frequency: 1200, freqEnd: 600, type: 'sine', duration: 0.3, gain: 0.15 }), 100);
  },
  bomb() {
    tone({ frequency: 120, freqEnd: 60, type: 'sawtooth', duration: 0.4, gain: 0.4 });
    setTimeout(() => tone({ frequency: 80, type: 'square', duration: 0.3, gain: 0.3 }), 200);
  },
  defuse() {
    tone({ frequency: 700, freqEnd: 1100, type: 'sine', duration: 0.2, gain: 0.3, attack: 0.005 });
    setTimeout(() => tone({ frequency: 1400, type: 'sine', duration: 0.15, gain: 0.25 }), 100);
  },
  bossHit() {
    tone({ frequency: 300, freqEnd: 150, type: 'square', duration: 0.2, gain: 0.35 });
    setTimeout(() => tone({ frequency: 600, freqEnd: 900, type: 'sine', duration: 0.18, gain: 0.2 }), 60);
  },
  combo(level) {
    const freqs = [0, 0, 0, 660, 0, 880, 0, 0, 0, 0, 1100, 0, 0, 0, 0, 1400];
    const f = freqs[Math.min(level, 15)] || 660;
    tone({ frequency: f, freqEnd: f * 1.2, type: 'sine', duration: 0.35, gain: 0.4, attack: 0.01 });
    setTimeout(() => tone({ frequency: f * 1.5, type: 'sine', duration: 0.2, gain: 0.25 }), 180);
  },
};
