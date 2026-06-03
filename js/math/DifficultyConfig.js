// graceTime: free seconds before the timer bar appears
// timeLimit: seconds on the countdown (null = no timer)
// ops: operator symbols available this level
// minBubbleScale / maxBubbleScale: size variation range (1.0 = default, applied at spawn)
// unlockMessage: shown once on first reach
export const LEVELS = [

  // ── Addition — levels 1-10 ───────────────────────────────────────────────
  { level:  1, ops: ['+'],      maxOperand:  5, targetCount: 3, speed:  55, graceTime: 12, timeLimit: null, questionsToComplete: 7, minBubbleScale: 1.0,  maxBubbleScale: 1.0  },
  { level:  2, ops: ['+'],      maxOperand:  8, targetCount: 3, speed:  65, graceTime: 10, timeLimit: 18,   questionsToComplete: 7, minBubbleScale: 1.0,  maxBubbleScale: 1.0  },
  { level:  3, ops: ['+'],      maxOperand: 10, targetCount: 3, speed:  75, graceTime:  8, timeLimit: 15,   questionsToComplete: 7, minBubbleScale: 1.0,  maxBubbleScale: 1.0  },
  { level:  4, ops: ['+'],      maxOperand: 12, targetCount: 3, speed:  85, graceTime:  8, timeLimit: 13,   questionsToComplete: 7, minBubbleScale: 1.0,  maxBubbleScale: 1.0  },
  { level:  5, ops: ['+'],      maxOperand: 15, targetCount: 4, speed:  95, graceTime:  6, timeLimit: 12,   questionsToComplete: 7, minBubbleScale: 1.0,  maxBubbleScale: 1.0  },
  { level:  6, ops: ['+'],      maxOperand: 18, targetCount: 4, speed: 110, graceTime:  6, timeLimit: 11,   questionsToComplete: 7, minBubbleScale: 1.0,  maxBubbleScale: 1.0  },
  { level:  7, ops: ['+'],      maxOperand: 22, targetCount: 4, speed: 125, graceTime:  4, timeLimit: 10,   questionsToComplete: 7, minBubbleScale: 1.0,  maxBubbleScale: 1.0  },
  { level:  8, ops: ['+'],      maxOperand: 28, targetCount: 4, speed: 142, graceTime:  4, timeLimit:  9,   questionsToComplete: 7, minBubbleScale: 1.0,  maxBubbleScale: 1.0  },
  { level:  9, ops: ['+'],      maxOperand: 35, targetCount: 5, speed: 160, graceTime:  2, timeLimit:  9,   questionsToComplete: 7, minBubbleScale: 1.0,  maxBubbleScale: 1.0  },
  { level: 10, ops: ['+'],      maxOperand: 50, targetCount: 5, speed: 180, graceTime:  2, timeLimit:  8,   questionsToComplete: 7, minBubbleScale: 1.0,  maxBubbleScale: 1.0  },

  // ── Subtraction — levels 11-20 ───────────────────────────────────────────
  { level: 11, ops: ['-'],           maxOperand:  8, targetCount: 3, speed:  65, graceTime: 10, timeLimit: 14,   questionsToComplete: 7, minBubbleScale: 1.0,  maxBubbleScale: 1.0,  unlockMessage: 'Subtraction unlocked!' },
  { level: 12, ops: ['-'],           maxOperand: 12, targetCount: 3, speed:  80, graceTime:  8, timeLimit: 12,   questionsToComplete: 7, minBubbleScale: 1.0,  maxBubbleScale: 1.0  },
  { level: 13, ops: ['-'],           maxOperand: 15, targetCount: 4, speed:  98, graceTime:  6, timeLimit: 11,   questionsToComplete: 7, minBubbleScale: 1.0,  maxBubbleScale: 1.0  },
  { level: 14, ops: ['+', '-'],      maxOperand: 15, targetCount: 4, speed: 114, graceTime:  6, timeLimit: 11,   questionsToComplete: 7, minBubbleScale: 0.88, maxBubbleScale: 1.18 },
  { level: 15, ops: ['+', '-'],      maxOperand: 20, targetCount: 4, speed: 130, graceTime:  4, timeLimit: 10,   questionsToComplete: 7, minBubbleScale: 0.85, maxBubbleScale: 1.22 },
  { level: 16, ops: ['+', '-'],      maxOperand: 25, targetCount: 4, speed: 148, graceTime:  4, timeLimit:  9,   questionsToComplete: 7, minBubbleScale: 0.82, maxBubbleScale: 1.25 },
  { level: 17, ops: ['+', '-'],      maxOperand: 30, targetCount: 5, speed: 168, graceTime:  3, timeLimit:  9,   questionsToComplete: 7, minBubbleScale: 0.80, maxBubbleScale: 1.28 },
  { level: 18, ops: ['+', '-'],      maxOperand: 40, targetCount: 5, speed: 188, graceTime:  2, timeLimit:  8,   questionsToComplete: 7, minBubbleScale: 0.78, maxBubbleScale: 1.28 },
  { level: 19, ops: ['+', '-'],      maxOperand: 50, targetCount: 5, speed: 210, graceTime:  2, timeLimit:  8,   questionsToComplete: 7, minBubbleScale: 0.76, maxBubbleScale: 1.30 },
  { level: 20, ops: ['+', '-'],      maxOperand: 50, targetCount: 5, speed: 235, graceTime:  0, timeLimit:  7,   questionsToComplete: 7, minBubbleScale: 0.75, maxBubbleScale: 1.30 },

  // ── Multiplication — levels 21-30 ────────────────────────────────────────
  { level: 21, ops: ['×'],           maxOperand:  4, targetCount: 3, speed:  72, graceTime: 10, timeLimit: 16,   questionsToComplete: 7, minBubbleScale: 0.88, maxBubbleScale: 1.18, unlockMessage: 'Multiplication unlocked!' },
  { level: 22, ops: ['×'],           maxOperand:  6, targetCount: 3, speed:  90, graceTime:  8, timeLimit: 14,   questionsToComplete: 7, minBubbleScale: 0.85, maxBubbleScale: 1.22 },
  { level: 23, ops: ['×'],           maxOperand:  9, targetCount: 4, speed: 110, graceTime:  6, timeLimit: 12,   questionsToComplete: 7, minBubbleScale: 0.82, maxBubbleScale: 1.25 },
  { level: 24, ops: ['+', '-', '×'], maxOperand:  9, targetCount: 4, speed: 130, graceTime:  5, timeLimit: 11,   questionsToComplete: 7, minBubbleScale: 0.80, maxBubbleScale: 1.28 },
  { level: 25, ops: ['+', '-', '×'], maxOperand: 10, targetCount: 4, speed: 152, graceTime:  4, timeLimit: 10,   questionsToComplete: 7, minBubbleScale: 0.78, maxBubbleScale: 1.30 },
  { level: 26, ops: ['+', '-', '×'], maxOperand: 12, targetCount: 5, speed: 175, graceTime:  3, timeLimit:  9,   questionsToComplete: 7, minBubbleScale: 0.75, maxBubbleScale: 1.32 },
  { level: 27, ops: ['+', '-', '×'], maxOperand: 12, targetCount: 5, speed: 200, graceTime:  2, timeLimit:  9,   questionsToComplete: 7, minBubbleScale: 0.72, maxBubbleScale: 1.35 },

  // ── Division + all ops — levels 28-35 ────────────────────────────────────
  { level: 28, ops: ['÷'],                    maxOperand:  5, targetCount: 3, speed:  78, graceTime: 10, timeLimit: 16,   questionsToComplete: 7, minBubbleScale: 0.85, maxBubbleScale: 1.22, unlockMessage: 'Division unlocked!' },
  { level: 29, ops: ['÷'],                    maxOperand:  8, targetCount: 3, speed: 100, graceTime:  8, timeLimit: 13,   questionsToComplete: 7, minBubbleScale: 0.82, maxBubbleScale: 1.25 },
  { level: 30, ops: ['+', '-', '×', '÷'],    maxOperand:  8, targetCount: 4, speed: 130, graceTime:  6, timeLimit: 12,   questionsToComplete: 7, minBubbleScale: 0.80, maxBubbleScale: 1.28 },
  { level: 31, ops: ['+', '-', '×', '÷'],    maxOperand: 10, targetCount: 4, speed: 158, graceTime:  4, timeLimit: 10,   questionsToComplete: 7, minBubbleScale: 0.76, maxBubbleScale: 1.32 },
  { level: 32, ops: ['+', '-', '×', '÷'],    maxOperand: 10, targetCount: 5, speed: 185, graceTime:  3, timeLimit:  9,   questionsToComplete: 7, minBubbleScale: 0.72, maxBubbleScale: 1.35 },
  { level: 33, ops: ['+', '-', '×', '÷'],    maxOperand: 12, targetCount: 5, speed: 215, graceTime:  2, timeLimit:  8,   questionsToComplete: 7, minBubbleScale: 0.70, maxBubbleScale: 1.38 },
  { level: 34, ops: ['+', '-', '×', '÷'],    maxOperand: 12, targetCount: 5, speed: 248, graceTime:  1, timeLimit:  8,   questionsToComplete: 7, minBubbleScale: 0.68, maxBubbleScale: 1.40 },
  { level: 35, ops: ['+', '-', '×', '÷'],    maxOperand: 12, targetCount: 5, speed: 285, graceTime:  0, timeLimit:  7,   questionsToComplete: 7, minBubbleScale: 0.65, maxBubbleScale: 1.42 },
];

export function getLevel(n) {
  return LEVELS[Math.min(n - 1, LEVELS.length - 1)];
}

export const MAX_LEVEL = LEVELS.length;
