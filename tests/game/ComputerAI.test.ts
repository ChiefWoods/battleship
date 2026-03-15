import { describe, expect, it } from "vitest";
import { ComputerAI } from "../../src/game/ComputerAI.ts";
import { Gameboard } from "../../src/game/Gameboard.ts";

describe("ComputerAI", () => {
  it("selects valid unattacked coordinates", () => {
    const ai = new ComputerAI();
    const board = new Gameboard();

    const first = ai.selectTarget(board);
    expect(first.row).toBeGreaterThanOrEqual(0);
    expect(first.row).toBeLessThan(10);
    expect(first.col).toBeGreaterThanOrEqual(0);
    expect(first.col).toBeLessThan(10);
  });

  it("prioritizes adjacent cells after a hit", () => {
    const ai = new ComputerAI();
    const board = new Gameboard();
    const center = { row: 5, col: 5 };
    ai.registerResult(center, true, false);

    const target = ai.selectTarget(board);
    const adjacent = [
      { row: 4, col: 5 },
      { row: 6, col: 5 },
      { row: 5, col: 4 },
      { row: 5, col: 6 },
    ];

    expect(adjacent).toContainEqual(target);
  });

  it("clears priority targets after sinking ship", () => {
    const ai = new ComputerAI();
    const board = new Gameboard();
    for (let row = 0; row < 10; row += 1) {
      for (let col = 0; col < 10; col += 1) {
        if (row === 9 && col === 9) {
          continue;
        }
        board.receiveAttack({ row, col });
      }
    }
    ai.registerResult({ row: 5, col: 5 }, true, true);

    const target = ai.selectTarget(board);
    expect(target).toEqual({ row: 9, col: 9 });
  });
});
