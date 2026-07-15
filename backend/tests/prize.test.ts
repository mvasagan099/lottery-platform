import { describe, it, expect } from 'vitest'

function evaluateTicket(
  ticketNumbers: number[],
  winningNumbers: number[],
  prizeDivisions: { matchNumbers: number, fixedPrize: number }[]
) {
  const matched = ticketNumbers.filter(n => winningNumbers.includes(n)).length;
  let bestPrize = 0;
  for (const div of prizeDivisions) {
    if (div.matchNumbers === matched) {
      if (div.fixedPrize > bestPrize) bestPrize = div.fixedPrize;
    }
  }
  return bestPrize;
}

describe('Prize Evaluation Logic', () => {
  const divisions = [
    { matchNumbers: 6, fixedPrize: 1000000 },
    { matchNumbers: 5, fixedPrize: 10000 },
    { matchNumbers: 4, fixedPrize: 500 }
  ];

  it('should return highest prize for 6 matches', () => {
    const prize = evaluateTicket([1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6], divisions);
    expect(prize).toBe(1000000);
  });

  it('should return lower prize for 4 matches', () => {
    const prize = evaluateTicket([1, 2, 3, 4, 10, 11], [1, 2, 3, 4, 5, 6], divisions);
    expect(prize).toBe(500);
  });

  it('should return 0 for no matches', () => {
    const prize = evaluateTicket([10, 11, 12, 13, 14, 15], [1, 2, 3, 4, 5, 6], divisions);
    expect(prize).toBe(0);
  });
})

