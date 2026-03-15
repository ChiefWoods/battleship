import { GRID_SIZE } from "./constants.ts";
import type { Coord, Orientation } from "./types.ts";

export function toCellKey(coord: Coord): string {
  return `${coord.row}:${coord.col}`;
}

export function isCoordInBounds(coord: Coord): boolean {
  return coord.row >= 0 && coord.col >= 0 && coord.row < GRID_SIZE && coord.col < GRID_SIZE;
}

export function getCellsForShip(start: Coord, length: number, orientation: Orientation): Coord[] {
  const cells: Coord[] = [];
  for (let index = 0; index < length; index += 1) {
    cells.push({
      row: orientation === "horizontal" ? start.row : start.row + index,
      col: orientation === "horizontal" ? start.col + index : start.col,
    });
  }
  return cells;
}

export function getAdjacentCoords(coord: Coord): Coord[] {
  return [
    { row: coord.row - 1, col: coord.col },
    { row: coord.row + 1, col: coord.col },
    { row: coord.row, col: coord.col - 1 },
    { row: coord.row, col: coord.col + 1 },
  ].filter(isCoordInBounds);
}

export function randomInt(maxExclusive: number): number {
  return Math.floor(Math.random() * maxExclusive);
}
