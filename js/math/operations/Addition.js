export const Addition = {
  symbol: '+',
  generate({ maxOperand = 10 } = {}) {
    const a = Math.floor(Math.random() * maxOperand) + 1;
    const b = Math.floor(Math.random() * maxOperand) + 1;
    return { operandA: a, operandB: b, operator: '+', answer: a + b };
  }
};
