export const Multiplication = {
  symbol: '×',
  generate({ maxOperand = 10 } = {}) {
    const cap = Math.min(maxOperand, 12);
    const a = Math.floor(Math.random() * cap) + 1;
    const b = Math.floor(Math.random() * cap) + 1;
    return { operandA: a, operandB: b, operator: '×', answer: a * b };
  }
};
