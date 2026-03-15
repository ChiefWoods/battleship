import { ComputerAI } from "./ComputerAI.ts";
import { DEFAULT_FLEET, GRID_SIZE } from "./constants.ts";
import { Player } from "./Player.ts";
import { getCellsForShip } from "./utils.ts";
import type {
  BattlePhase,
  BoardCellView,
  Coord,
  GameMode,
  Interstitial,
  Orientation,
  PlacementStatus,
} from "./types.ts";

interface SetupState {
  playerIndex: 0 | 1;
  orientation: Orientation;
  selectedShipId: string;
}

export interface GameStateView {
  mode: GameMode;
  phase: BattlePhase;
  activePlayer: "player-1" | "player-2";
  setupPlayer: "player-1" | "player-2";
  selectedShipId: string;
  status: string;
  winner: "player-1" | "player-2" | null;
  setupOrientation: Orientation;
  fleetStatus: PlacementStatus[];
  playerBoard: BoardCellView[];
  enemyBoard: BoardCellView[];
  canStartBattle: boolean;
  interstitial: Interstitial | null;
}

export class GameController {
  private mode: GameMode;
  private phase: BattlePhase;
  private players: [Player, Player];
  private setup: SetupState;
  private activePlayerIndex: 0 | 1;
  private status: string;
  private winner: "player-1" | "player-2" | null;
  private interstitial: Interstitial | null;
  private ai: ComputerAI;

  public constructor(mode: GameMode = "vs-computer") {
    this.mode = mode;
    this.phase = "setup";
    this.players = [new Player("player-1", "human"), new Player("player-2", "computer")];
    this.setup = {
      playerIndex: 0,
      orientation: "horizontal",
      selectedShipId: DEFAULT_FLEET[0].id,
    };
    this.activePlayerIndex = 0;
    this.status = "Place your fleet to begin.";
    this.winner = null;
    this.interstitial = null;
    this.ai = new ComputerAI();
    this.reset(mode);
  }

  public reset(mode = this.mode): void {
    this.mode = mode;
    this.phase = "setup";
    this.players = [
      new Player("player-1", "human"),
      new Player("player-2", mode === "vs-computer" ? "computer" : "human"),
    ];
    this.setup = {
      playerIndex: 0,
      orientation: "horizontal",
      selectedShipId: DEFAULT_FLEET[0].id,
    };
    this.activePlayerIndex = 0;
    this.status = "Deploy your fleet. Drag ships onto your ocean grid.";
    this.winner = null;
    this.interstitial = null;
    this.ai.reset();
  }

  public setMode(mode: GameMode): void {
    this.reset(mode);
  }

  public rotateShip(): void {
    this.setup.orientation = this.setup.orientation === "horizontal" ? "vertical" : "horizontal";
  }

  public selectShip(shipId: string): void {
    this.setup.selectedShipId = shipId;
  }

  public randomizeCurrentPlayerFleet(): void {
    const current = this.players[this.setup.playerIndex];
    current.board.randomizeFleet(DEFAULT_FLEET);
    this.status = `${this.getPlayerLabel(this.setup.playerIndex)} fleet randomized.`;
    if (this.mode === "vs-computer" && this.setup.playerIndex === 0) {
      this.players[1].board.randomizeFleet(DEFAULT_FLEET);
      this.startBattle();
    }
  }

  public clearCurrentPlayerFleet(): void {
    const current = this.players[this.setup.playerIndex];
    current.board.clear();
    this.status = `${this.getPlayerLabel(this.setup.playerIndex)} fleet cleared.`;
  }

  public getPlacementPreview(
    row: number,
    col: number,
    shipId: string,
  ): {
    valid: boolean;
    cells: Coord[];
  } {
    if (this.phase !== "setup") {
      return { valid: false, cells: [] };
    }

    const ship = DEFAULT_FLEET.find((entry) => entry.id === shipId);
    if (ship === undefined) {
      return { valid: false, cells: [] };
    }

    const start = { row, col };
    const cells = getCellsForShip(start, ship.length, this.setup.orientation);
    const board = this.players[this.setup.playerIndex].board;
    const valid = board.canPlaceShip(start, ship.length, this.setup.orientation, ship.id);

    return { valid, cells };
  }

  public placeShipAt(row: number, col: number, shipId = this.setup.selectedShipId): boolean {
    if (this.phase !== "setup") {
      return false;
    }

    const ship = DEFAULT_FLEET.find((entry) => entry.id === shipId);
    if (ship === undefined) {
      this.status = "Unknown ship selected.";
      return false;
    }

    const current = this.players[this.setup.playerIndex];
    const placed = current.board.placeShip(
      ship.id,
      ship.length,
      { row, col },
      this.setup.orientation,
    );

    if (!placed) {
      this.status = "Invalid deployment. Adjust orientation or choose another tile.";
      return false;
    }

    const remaining = this.getPlacementStatus(this.setup.playerIndex).find(
      (entry) => !entry.placed,
    );
    if (remaining !== undefined) {
      this.setup.selectedShipId = remaining.ship.id;
    }

    this.status = `${ship.label} deployed.`;
    return true;
  }

  public completeCurrentSetupPhase(): boolean {
    if (!this.hasFullFleet(this.setup.playerIndex)) {
      this.status = "Deploy all ships before continuing.";
      return false;
    }

    if (this.mode === "vs-computer") {
      if (!this.hasFullFleet(1)) {
        this.players[1].board.randomizeFleet(DEFAULT_FLEET);
      }
      this.startBattle();
      return true;
    }

    if (this.setup.playerIndex === 0) {
      this.setup.playerIndex = 1;
      this.setup.selectedShipId = DEFAULT_FLEET[0].id;
      this.interstitial = {
        title: "Pass Device",
        description: "Player 2, take over and deploy your fleet. Player 1, look away.",
        cta: "Begin Player 2 Setup",
      };
      this.status = "Player 2 is preparing deployment.";
      return true;
    }

    this.startBattle();
    return true;
  }

  public confirmInterstitial(): void {
    if (this.interstitial === null) {
      return;
    }
    this.interstitial = null;
  }

  public attack(row: number, col: number): boolean {
    if (this.phase !== "battle" || this.interstitial !== null) {
      return false;
    }

    const attackerIndex = this.activePlayerIndex;
    const defenderIndex: 0 | 1 = attackerIndex === 0 ? 1 : 0;
    const attacker = this.players[attackerIndex];

    if (attacker.kind === "computer") {
      return false;
    }

    const result = this.players[defenderIndex].board.receiveAttack({ row, col });
    if (!result.valid) {
      this.status = "Coordinate already targeted.";
      return false;
    }

    this.status = result.hit ? "Direct hit!" : "Splash... miss.";
    if (this.players[defenderIndex].board.allShipsSunk(DEFAULT_FLEET.length)) {
      this.phase = "gameover";
      this.winner = attacker.id;
      this.status = `${this.getPlayerLabel(attackerIndex)} wins the battle.`;
      return true;
    }

    this.endTurn(result.hit, result.sunk);
    return true;
  }

  public runComputerTurnIfNeeded(): boolean {
    if (this.phase !== "battle" || this.interstitial !== null) {
      return false;
    }

    const current = this.players[this.activePlayerIndex];
    if (current.kind !== "computer") {
      return false;
    }

    const enemyIndex: 0 | 1 = this.activePlayerIndex === 0 ? 1 : 0;
    const target = this.ai.selectTarget(this.players[enemyIndex].board);
    const result = this.players[enemyIndex].board.receiveAttack(target);
    if (!result.valid) {
      return false;
    }

    this.ai.registerResult(target, result.hit, result.sunk);
    this.status = result.hit
      ? `Computer hit ${this.coordToLabel(target)}.`
      : `Computer missed at ${this.coordToLabel(target)}.`;

    if (this.players[enemyIndex].board.allShipsSunk(DEFAULT_FLEET.length)) {
      this.phase = "gameover";
      this.winner = current.id;
      this.status = "Computer has won the battle.";
      return true;
    }

    this.activePlayerIndex = enemyIndex;
    return true;
  }

  public getViewState(): GameStateView {
    const setupPlayerIndex = this.setup.playerIndex;
    const selfIndex: 0 | 1 = this.phase === "setup" ? setupPlayerIndex : this.activePlayerIndex;
    const enemyIndex: 0 | 1 = selfIndex === 0 ? 1 : 0;

    return {
      mode: this.mode,
      phase: this.phase,
      activePlayer: this.players[this.activePlayerIndex].id,
      setupPlayer: this.players[setupPlayerIndex].id,
      selectedShipId: this.setup.selectedShipId,
      status: this.status,
      winner: this.winner,
      setupOrientation: this.setup.orientation,
      fleetStatus: this.getPlacementStatus(setupPlayerIndex),
      playerBoard: this.buildBoard(selfIndex, true, this.phase === "setup"),
      enemyBoard: this.buildBoard(enemyIndex, this.phase === "gameover", false),
      canStartBattle: this.hasFullFleet(setupPlayerIndex),
      interstitial: this.interstitial,
    };
  }

  private buildBoard(playerIndex: 0 | 1, revealShips: boolean, canDrop: boolean): BoardCellView[] {
    const board = this.players[playerIndex].board;
    const cells: BoardCellView[] = [];

    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let col = 0; col < GRID_SIZE; col += 1) {
        const coord = { row, col };
        cells.push({
          key: `${row}:${col}`,
          row,
          col,
          hasShip: revealShips && board.hasShipAt(coord),
          isHit: board.isHitAt(coord),
          isMiss: board.isMissAt(coord),
          isSunk: board.isSunkAt(coord),
          canTarget:
            this.phase === "battle" &&
            this.players[this.activePlayerIndex].kind === "human" &&
            playerIndex !== this.activePlayerIndex &&
            !board.hasBeenAttacked(coord) &&
            this.interstitial === null,
          canDrop: canDrop && this.phase === "setup",
        });
      }
    }

    return cells;
  }

  private getPlacementStatus(playerIndex: 0 | 1): PlacementStatus[] {
    const board = this.players[playerIndex].board;
    const ids = new Set(board.getShipIds());
    return DEFAULT_FLEET.map((ship) => ({
      ship,
      placed: ids.has(ship.id),
    }));
  }

  private hasFullFleet(playerIndex: 0 | 1): boolean {
    return this.getPlacementStatus(playerIndex).every((item) => item.placed);
  }

  private startBattle(): void {
    this.phase = "battle";
    this.activePlayerIndex = 0;
    this.status =
      this.mode === "vs-player"
        ? "Battle begins. Player 1 fires first."
        : "Battle begins. Target the enemy waters.";

    if (this.mode === "vs-player") {
      this.interstitial = {
        title: "Pass Device",
        description: "Player 1, take command. Player 2, look away.",
        cta: "Begin Battle",
      };
    }
  }

  private endTurn(hit: boolean, sunk: boolean): void {
    if (this.mode === "vs-player") {
      const next = this.activePlayerIndex === 0 ? 1 : 0;
      this.activePlayerIndex = next;
      this.interstitial = {
        title: "Pass Device",
        description: `${this.getPlayerLabel(next)} to act. Keep enemy board hidden.`,
        cta: "Continue",
      };
      if (hit) {
        this.status = sunk ? "Ship sunk. Pass device." : "Hit confirmed. Pass device.";
      }
      return;
    }

    if (this.players[1].kind === "computer") {
      this.activePlayerIndex = 1;
      if (hit) {
        this.status = sunk ? "Enemy ship sunk. Computer is thinking..." : "Hit! Computer turn.";
      } else {
        this.status = "Miss. Computer turn.";
      }
    } else {
      this.activePlayerIndex = this.activePlayerIndex === 0 ? 1 : 0;
    }
  }

  private getPlayerLabel(index: 0 | 1): string {
    if (this.mode === "vs-computer" && index === 1) {
      return "Computer";
    }
    return index === 0 ? "Player 1" : "Player 2";
  }

  private coordToLabel(coord: Coord): string {
    const letter = String.fromCharCode(65 + coord.col);
    return `${letter}${coord.row + 1}`;
  }
}
