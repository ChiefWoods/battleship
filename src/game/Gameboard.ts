import { GRID_SIZE } from "./constants.ts";
import { Ship } from "./Ship.ts";
import { getCellsForShip, isCoordInBounds, toCellKey } from "./utils.ts";
import type { AttackResult, Coord, Orientation } from "./types.ts";

interface PlacedShip {
  ship: Ship;
  cells: Coord[];
  hits: Set<string>;
}

export class Gameboard {
  private shipsById: Map<string, PlacedShip>;
  private shipByCell: Map<string, string>;
  private attacks: Set<string>;
  private misses: Set<string>;

  public constructor() {
    this.shipsById = new Map();
    this.shipByCell = new Map();
    this.attacks = new Set();
    this.misses = new Set();
  }

  public clear(): void {
    this.shipsById.clear();
    this.shipByCell.clear();
    this.attacks.clear();
    this.misses.clear();
  }

  public canPlaceShip(
    start: Coord,
    length: number,
    orientation: Orientation,
    shipIdToIgnore: string | null = null,
  ): boolean {
    const cells = getCellsForShip(start, length, orientation);
    return cells.every((coord) => {
      if (!isCoordInBounds(coord)) {
        return false;
      }
      const occupant = this.shipByCell.get(toCellKey(coord));
      return occupant === undefined || occupant === shipIdToIgnore;
    });
  }

  public placeShip(
    shipId: string,
    length: number,
    start: Coord,
    orientation: Orientation,
  ): boolean {
    const existing = this.shipsById.get(shipId);
    if (!this.canPlaceShip(start, length, orientation, shipId)) {
      return false;
    }

    if (existing !== undefined) {
      existing.cells.forEach((coord) => {
        this.shipByCell.delete(toCellKey(coord));
      });
    }

    const cells = getCellsForShip(start, length, orientation);
    const hits = new Set<string>();
    const ship = new Ship(shipId, length);

    if (existing !== undefined) {
      existing.hits.forEach((key) => {
        hits.add(key);
        ship.hit();
      });
    }

    const placed: PlacedShip = { ship, cells, hits };
    this.shipsById.set(shipId, placed);
    cells.forEach((coord) => this.shipByCell.set(toCellKey(coord), shipId));
    return true;
  }

  public getShipIds(): string[] {
    return Array.from(this.shipsById.keys());
  }

  public getShipOrientation(shipId: string): Orientation | null {
    const placed = this.shipsById.get(shipId);
    if (placed === undefined || placed.cells.length <= 1) {
      return null;
    }
    const [first, second] = placed.cells;
    return first.row === second.row ? "horizontal" : "vertical";
  }

  public receiveAttack(coord: Coord): AttackResult {
    if (!isCoordInBounds(coord)) {
      return { valid: false, hit: false, sunk: false, shipId: null };
    }

    const key = toCellKey(coord);
    if (this.attacks.has(key)) {
      return { valid: false, hit: false, sunk: false, shipId: null };
    }

    this.attacks.add(key);
    const shipId = this.shipByCell.get(key);
    if (shipId === undefined) {
      this.misses.add(key);
      return { valid: true, hit: false, sunk: false, shipId: null };
    }

    const placed = this.shipsById.get(shipId);
    if (placed === undefined) {
      return { valid: false, hit: false, sunk: false, shipId: null };
    }

    if (!placed.hits.has(key)) {
      placed.hits.add(key);
      placed.ship.hit();
    }

    return {
      valid: true,
      hit: true,
      sunk: placed.ship.isSunk(),
      shipId,
    };
  }

  public hasBeenAttacked(coord: Coord): boolean {
    return this.attacks.has(toCellKey(coord));
  }

  public hasShipAt(coord: Coord): boolean {
    return this.shipByCell.has(toCellKey(coord));
  }

  public getShipIdAt(coord: Coord): string | null {
    return this.shipByCell.get(toCellKey(coord)) ?? null;
  }

  public isMissAt(coord: Coord): boolean {
    return this.misses.has(toCellKey(coord));
  }

  public isHitAt(coord: Coord): boolean {
    const key = toCellKey(coord);
    const shipId = this.shipByCell.get(key);
    if (shipId === undefined) {
      return false;
    }
    const placed = this.shipsById.get(shipId);
    return placed?.hits.has(key) ?? false;
  }

  public isSunkAt(coord: Coord): boolean {
    const shipId = this.shipByCell.get(toCellKey(coord));
    if (shipId === undefined) {
      return false;
    }
    return this.shipsById.get(shipId)?.ship.isSunk() ?? false;
  }

  public allShipsSunk(requiredShipCount: number): boolean {
    if (this.shipsById.size < requiredShipCount) {
      return false;
    }
    return Array.from(this.shipsById.values()).every(({ ship }) => ship.isSunk());
  }

  public randomizeFleet(
    fleet: Array<{ id: string; length: number }>,
    maxAttemptsPerShip = 300,
  ): void {
    this.clear();
    fleet.forEach((ship) => {
      let placed = false;
      for (let attempt = 0; attempt < maxAttemptsPerShip; attempt += 1) {
        const orientation: Orientation = Math.random() > 0.5 ? "horizontal" : "vertical";
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);
        placed = this.placeShip(ship.id, ship.length, { row, col }, orientation);
        if (placed) {
          break;
        }
      }
      if (!placed) {
        throw new Error(`Could not place ship ${ship.id} randomly.`);
      }
    });
  }
}
