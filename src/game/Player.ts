import { Gameboard } from "./Gameboard.ts";
import type { PlayerKind } from "./types.ts";

export class Player {
  public readonly id: "player-1" | "player-2";
  public readonly kind: PlayerKind;
  public readonly board: Gameboard;

  public constructor(id: "player-1" | "player-2", kind: PlayerKind) {
    this.id = id;
    this.kind = kind;
    this.board = new Gameboard();
  }
}
