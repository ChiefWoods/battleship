import { GRID_SIZE } from "./constants.ts";
import { getAdjacentCoords, randomInt, toCellKey } from "./utils.ts";
import type { Coord } from "./types.ts";
import { Gameboard } from "./Gameboard.ts";

export class ComputerAI {
  private priorityTargets: Coord[];
  private attackedKeys: Set<string>;

  public constructor() {
    this.priorityTargets = [];
    this.attackedKeys = new Set();
  }

  public reset(): void {
    this.priorityTargets = [];
    this.attackedKeys.clear();
  }

  public selectTarget(enemyBoard: Gameboard): Coord {
    while (this.priorityTargets.length > 0) {
      const next = this.priorityTargets.shift();
      if (next === undefined) {
        break;
      }
      const key = toCellKey(next);
      if (!this.attackedKeys.has(key) && !enemyBoard.hasBeenAttacked(next)) {
        this.attackedKeys.add(key);
        return next;
      }
    }

    const available: Coord[] = [];
    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        const coord = { row, col };
        const key = toCellKey(coord);
        if (!this.attackedKeys.has(key) && !enemyBoard.hasBeenAttacked(coord)) {
          available.push(coord);
        }
      }
    }

    if (available.length === 0) {
      return { row: 0, col: 0 };
    }

    const choice = available[randomInt(available.length)];
    this.attackedKeys.add(toCellKey(choice));
    return choice;
  }

  public registerResult(coord: Coord, hit: boolean, sunk: boolean): void {
    if (!hit) {
      return;
    }

    if (sunk) {
      this.priorityTargets = [];
      return;
    }

    const adjacent = getAdjacentCoords(coord);
    adjacent.forEach((next) => {
      const key = toCellKey(next);
      if (!this.attackedKeys.has(key)) {
        this.priorityTargets.push(next);
      }
    });
  }
}
