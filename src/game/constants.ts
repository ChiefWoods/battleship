import type { FleetShip } from "./types.ts";

export const GRID_SIZE = 10;

export const DEFAULT_FLEET: FleetShip[] = [
  { id: "carrier", label: "Carrier", length: 5 },
  { id: "battleship", label: "Battleship", length: 4 },
  { id: "cruiser", label: "Cruiser", length: 3 },
  { id: "submarine", label: "Submarine", length: 3 },
  { id: "destroyer", label: "Destroyer", length: 2 },
];
