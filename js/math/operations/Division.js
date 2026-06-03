export const Division = {
  symbol: '÷',
  generate({ maxOperand = 10 } = {}) {
    const cap = Math.min(maxOperand, 12);
    const b = Math.floor(Math.random() * cap) + 1;
    const answer = Math.floor(Math.random() * cap) + 1;
    const a = b * answer;
    return { operandA: a, operandB: b, operator: '÷', answer };
  }
};
