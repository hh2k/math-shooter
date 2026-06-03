const KEY = 'mathshooter_progress';

export const RANKS = [
  { name: 'Rookie',   minXP:      0 },
  { name: 'Cadet',    minXP:    500 },
  { name: 'Soldier',  minXP:   2000 },
  { name: 'Veteran',  minXP:   5000 },
  { name: 'Expert',   minXP:  10000 },
  { name: 'Ace',      minXP:  20000 },
  { name: 'Math God', minXP:  50000 },
];

const DEFAULTS = {
  xp: 0,
  stars: {},
  highscore: 0,
  dailyDate: null,
  dailyScore: 0,
};

export const Progress = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
    } catch (_) {
      return { ...DEFAULTS };
    }
  },

  save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (_) {}
  },

  getRank(xp) {
    let rank = RANKS[0];
    for (const r of RANKS) {
      if (xp >= r.minXP) rank = r;
    }
    return rank;
  },

  getNextRankXP(xp) {
    for (const r of RANKS) {
      if (r.minXP > xp) return r.minXP;
    }
    return null;
  },

  isUnlocked(n, stars) {
    if (n <= 1) return true;
    const prev = stars[n - 1] ?? 0;
    return prev >= 2;
  },

  calcXP(score, stars, level) {
    return Math.floor(score * 0.1 + stars * 50 + level * 20);
  },
};
