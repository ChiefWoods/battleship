import { describe, expect, it } from "vitest";
import { Ship } from "../../src/game/Ship.ts";

describe("Ship", () => {
  it("tracks hits and sunk state", () => {
    const ship = new Ship("destroyer", 2);
    expect(ship.getHits()).toBe(0);
    expect(ship.isSunk()).toBe(false);

    ship.hit();
    expect(ship.getHits()).toBe(1);
    expect(ship.isSunk()).toBe(false);

    ship.hit();
    expect(ship.getHits()).toBe(2);
    expect(ship.isSunk()).toBe(true);
  });

  it("does not increase hits beyond length", () => {
    const ship = new Ship("scout", 1);
    ship.hit();
    ship.hit();
    ship.hit();

    expect(ship.getHits()).toBe(1);
    expect(ship.isSunk()).toBe(true);
  });
});
