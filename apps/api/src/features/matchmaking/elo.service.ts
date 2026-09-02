const K = 32;

export interface EloResult {
  winnerNewElo: number;
  loserNewElo:  number;
  winnerDelta:  number;
  loserDelta:   number;
}

/**
 * Standard Elo formula with K=32.
 * Expected score: E = 1 / (1 + 10^((Rb - Ra) / 400))
 * New rating:     R' = R + K * (S - E)
 *   S = 1 for win, 0 for loss
 */
export function calculateElo(winnerElo: number, loserElo: number): EloResult {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLoser  = 1 - expectedWinner;

  const winnerDelta = Math.round(K * (1 - expectedWinner));
  const loserDelta  = Math.round(K * (0 - expectedLoser));

  return {
    winnerNewElo: winnerElo + winnerDelta,
    loserNewElo:  Math.max(0, loserElo + loserDelta),
    winnerDelta,
    loserDelta,
  };
}
