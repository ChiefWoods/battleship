export type GameMode = "vs-computer" | "vs-player";
export type Orientation = "horizontal" | "vertical";
export type PlayerKind = "human" | "computer";
export type BattlePhase = "setup" | "battle" | "gameover";

export interface Coord {
  row: number;
  col: number;
}

export interface FleetShip {
  id: string;
  label: string;
  length: number;
}

export interface AttackResult {
  valid: boolean;
  hit: boolean;
  sunk: boolean;
  shipId: string | null;
}

export interface Interstitial {
  title: string;
  description: string;
  cta: string;
}

export interface BoardCellView {
  key: string;
  row: number;
  col: number;
  shipId: string | null;
  hasShip: boolean;
  isHit: boolean;
  isMiss: boolean;
  isSunk: boolean;
  canTarget: boolean;
  canDrop: boolean;
  canDragShip: boolean;
}

export interface PlacementStatus {
  ship: FleetShip;
  placed: boolean;
}
