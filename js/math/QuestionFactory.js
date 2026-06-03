import { Addition } from './operations/Addition.js';
import { Subtraction } from './operations/Subtraction.js';
import { Multiplication } from './operations/Multiplication.js';
import { Division } from './operations/Division.js';

const registry = { '+': Addition, '-': Subtraction, '×': Multiplication, '÷': Division };

export const QuestionFactory = {
  register(op, strategy) {
    registry[op] = strategy;
  },

  // levelConfig: { maxOperand, ... } from DifficultyConfig
  generate(ops = ['+'], levelConfig = {}) {
    const op = ops[Math.floor(Math.random() * ops.length)];
    const strategy = registry[op];
    if (!strategy) throw new Error(`No strategy for operator: ${op}`);
    return strategy.generate(levelConfig);
  },

  buildTargetValues(question, count = 4) {
    const { answer } = question;
    const values = new Set([answer]);
    const spread = Math.max(5, Math.ceil(answer * 0.5));
    let attempts = 0;
    while (values.size < count && attempts < 200) {
      const delta = Math.floor(Math.random() * spread * 2) - spread;
      const wrong = answer + delta;
      if (wrong !== answer && wrong > 0) values.add(wrong);
      attempts++;
    }
    let offset = 1;
    while (values.size < count) {
      if (!values.has(answer + offset)) values.add(answer + offset);
      else if (!values.has(answer - offset)) values.add(answer - offset);
      offset++;
    }
    return shuffle([...values].slice(0, count));
  }
};

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
