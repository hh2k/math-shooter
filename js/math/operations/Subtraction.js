export const Subtraction = {
  symbol: '-',
  generate({ maxOperand = 10 } = {}) {
    const a = Math.floor(Math.random() * maxOperand) + 1;
    const b = Math.floor(Math.random() * a) + 1; // b <= a so result >= 0
    return { operandA: a, operandB: b, operator: '-', answer: a - b };
  }
};
