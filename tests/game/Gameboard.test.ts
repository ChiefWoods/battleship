import { describe, expect, it } from "vitest";
import { Gameboard } from "../../src/game/Gameboard.ts";

describe("Gameboard", () => {
  it("places ships and blocks overlap/out-of-bounds", () => {
    const board = new Gameboard();
    expect(board.placeShip("a", 3, { row: 0, col: 0 }, "horizontal")).toBe(true);
    expect(board.placeShip("b", 2, { row: 0, col: 1 }, "vertical")).toBe(false);
    expect(board.placeShip("c", 4, { row: 9, col: 9 }, "horizontal")).toBe(false);
  });

  it("records hits, misses and prevents duplicate attacks", () => {
    const board = new Gameboard();
    board.placeShip("a", 2, { row: 2, col: 2 }, "horizontal");

    const miss = board.receiveAttack({ row: 0, col: 0 });
    expect(miss.valid).toBe(true);
    expect(miss.hit).toBe(false);
    expect(board.isMissAt({ row: 0, col: 0 })).toBe(true);

    const firstHit = board.receiveAttack({ row: 2, col: 2 });
    expect(firstHit.valid).toBe(true);
    expect(firstHit.hit).toBe(true);
    expect(firstHit.sunk).toBe(false);
    expect(board.isHitAt({ row: 2, col: 2 })).toBe(true);

    const secondHit = board.receiveAttack({ row: 2, col: 3 });
    expect(secondHit.valid).toBe(true);
    expect(secondHit.hit).toBe(true);
    expect(secondHit.sunk).toBe(true);
    expect(board.allShipsSunk(1)).toBe(true);

    const duplicate = board.receiveAttack({ row: 2, col: 3 });
    expect(duplicate.valid).toBe(false);
  });

  it("randomizes a complete valid fleet", () => {
    const board = new Gameboard();
    const fleet = [
      { id: "carrier", length: 5 },
      { id: "battleship", length: 4 },
      { id: "destroyer", length: 2 },
    ];

    board.randomizeFleet(fleet);
    const ids = board.getShipIds();
    expect(ids.length).toBe(3);
    expect(ids).toEqual(expect.arrayContaining(["carrier", "battleship", "destroyer"]));
  });
});
