import type { GameStateView } from "../game/GameController.ts";

function renderBoardCell(
  cell: GameStateView["playerBoard"][number],
  board: "self" | "enemy",
): string {
  const classes = ["cell"];
  if (cell.hasShip) classes.push("cell-ship");
  if (cell.isHit) classes.push("cell-hit");
  if (cell.isMiss) classes.push("cell-miss");
  if (cell.isSunk) classes.push("cell-sunk");
  if (cell.canTarget) classes.push("cell-targetable");

  const attrs: string[] = [
    `class="${classes.join(" ")}"`,
    `data-row="${cell.row}"`,
    `data-col="${cell.col}"`,
    `data-board="${board}"`,
  ];
  if (cell.canDrop) {
    attrs.push('data-can-drop="true"');
  }
  if (board === "enemy" && cell.canTarget) {
    attrs.push('role="button"');
    attrs.push('tabindex="0"');
    attrs.push('aria-label="Attack coordinate"');
  }

  return `<button type="button" ${attrs.join(" ")}></button>`;
}

function renderFleetPanel(state: GameStateView): string {
  const items = state.fleetStatus
    .map((entry) => {
      const classes = ["ship-chip"];
      if (entry.placed) classes.push("ship-chip-placed");
      if (entry.ship.id === state.selectedShipId) classes.push("ship-chip-selected");
      return `<button
          type="button"
          class="${classes.join(" ")}"
          data-action="select-ship"
          data-ship-id="${entry.ship.id}"
          draggable="true"
        >
          <span class="ship-name">${entry.ship.label}</span>
          <span class="ship-length">${entry.ship.length}</span>
        </button>`;
    })
    .join("");

  return `<aside class="fleet-panel">
      <h2>Fleet Deployment</h2>
      <p>Drag ships onto the ocean grid. Use rotate to change orientation.</p>
      <div class="fleet-list">${items}</div>
      <div class="setup-actions">
        <button type="button" data-action="rotate">
          Rotate (${state.setupOrientation})
        </button>
        <button type="button" data-action="randomize">Randomize</button>
        <button type="button" data-action="clear-fleet">Clear</button>
        <button type="button" data-action="complete-setup" ${
          state.canStartBattle ? "" : "disabled"
        }>
          Confirm Fleet
        </button>
      </div>
    </aside>`;
}

function renderBoard(
  title: string,
  subtitle: string,
  board: "self" | "enemy",
  cells: GameStateView["playerBoard"],
): string {
  return `<section class="board-card">
      <header>
        <h3>${title}</h3>
        <p>${subtitle}</p>
      </header>
      <div class="grid" data-grid="${board}">
        ${cells.map((cell) => renderBoardCell(cell, board)).join("")}
      </div>
    </section>`;
}

function renderInterstitial(state: GameStateView): string {
  if (state.interstitial === null) {
    return "";
  }
  return `<div class="interstitial" aria-live="polite">
      <div class="interstitial-card">
        <h2>${state.interstitial.title}</h2>
        <p>${state.interstitial.description}</p>
        <button type="button" data-action="confirm-interstitial">${state.interstitial.cta}</button>
      </div>
    </div>`;
}

export function renderApp(state: GameStateView): string {
  const heading = state.phase === "setup" ? "Fleet Setup" : "Engagement";
  const modeLabel = state.mode === "vs-computer" ? "Mode: Vs Computer" : "Mode: 2 Players";
  const subtitle =
    state.phase === "setup"
      ? `Deploying: ${state.setupPlayer.replace("-", " ").toUpperCase()}`
      : `Turn: ${state.activePlayer.replace("-", " ").toUpperCase()}`;

  return `<main class="app-shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">Battleship Command</p>
          <h1>${heading}</h1>
          <p class="subtitle">${subtitle}</p>
          <p class="mode-pill">${modeLabel}</p>
        </div>
        <div class="topbar-actions">
          <button
            type="button"
            data-action="mode-vs-computer"
            class="${state.mode === "vs-computer" ? "is-active" : ""}"
            aria-pressed="${state.mode === "vs-computer"}"
          >
            Vs Computer
          </button>
          <button
            type="button"
            data-action="mode-vs-player"
            class="${state.mode === "vs-player" ? "is-active" : ""}"
            aria-pressed="${state.mode === "vs-player"}"
          >
            2 Players
          </button>
          <button type="button" data-action="restart">New Game</button>
        </div>
      </header>

      <section class="status-bar">
        <p>${state.status}</p>
      </section>

      <section class="battle-layout ${state.phase === "setup" ? "is-setup" : ""}">
        ${
          state.phase === "setup"
            ? renderFleetPanel(state)
            : renderBoard("Your Waters", "Defend your fleet", "self", state.playerBoard)
        }
        ${
          state.phase === "setup"
            ? renderBoard("Deployment Grid", "Drop ships here", "self", state.playerBoard)
            : renderBoard("Enemy Waters", "Fire on targetable cells", "enemy", state.enemyBoard)
        }
      </section>

      ${renderInterstitial(state)}
    </main>`;
}
