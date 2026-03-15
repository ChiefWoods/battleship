import { GameController } from "../game/GameController.ts";
import { renderApp } from "./render.ts";

interface EventBinderOptions {
  root: HTMLElement;
  controller: GameController;
}

export function bindEvents({ root, controller }: EventBinderOptions): void {
  let draggingShipId: string | null = null;
  let previewedCells: HTMLElement[] = [];
  let originShipCells: HTMLElement[] = [];
  let lastHoverCoord: { row: number; col: number } | null = null;
  let rightRotateLocked = false;

  function repaint(): void {
    root.innerHTML = renderApp(controller.getViewState());
  }

  function clearPlacementPreview(): void {
    previewedCells.forEach((cell) => {
      cell.classList.remove("cell-preview-valid", "cell-preview-invalid");
    });
    previewedCells = [];
  }

  function clearOriginShipHighlight(): void {
    originShipCells.forEach((cell) => {
      cell.classList.remove("cell-origin-ship");
    });
    originShipCells = [];
  }

  function applyOriginShipHighlight(shipId: string): void {
    clearOriginShipHighlight();
    const cells = root.querySelectorAll<HTMLElement>(
      `.cell[data-board='self'][data-ship-id='${shipId}']`,
    );
    cells.forEach((cell) => {
      cell.classList.add("cell-origin-ship");
      originShipCells.push(cell);
    });
  }

  function refreshDragVisualsAfterRepaint(): void {
    if (draggingShipId === null) {
      return;
    }
    applyOriginShipHighlight(draggingShipId);
    if (lastHoverCoord !== null) {
      applyPlacementPreview(lastHoverCoord.row, lastHoverCoord.col);
    }
  }

  function applyPlacementPreview(row: number, col: number): void {
    const state = controller.getViewState();
    if (state.phase !== "setup" || (state.canStartBattle && draggingShipId === null)) {
      clearPlacementPreview();
      return;
    }

    const previewShipId = draggingShipId ?? state.selectedShipId;
    const preview = controller.getPlacementPreview(row, col, previewShipId);
    clearPlacementPreview();

    preview.cells.forEach((coord) => {
      const selector = `.cell[data-board='self'][data-row='${coord.row}'][data-col='${coord.col}']`;
      const cell = root.querySelector<HTMLElement>(selector);
      if (cell === null) {
        return;
      }
      cell.classList.add(preview.valid ? "cell-preview-valid" : "cell-preview-invalid");
      previewedCells.push(cell);
    });
  }

  function queueComputerTurn(): void {
    const state = controller.getViewState();
    if (
      state.mode !== "vs-computer" ||
      state.phase !== "battle" ||
      state.activePlayer !== "player-2"
    ) {
      return;
    }
    window.setTimeout(() => {
      const moved = controller.runComputerTurnIfNeeded();
      if (!moved) {
        return;
      }
      repaint();
      queueComputerTurn();
    }, 450);
  }

  root.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const actionTarget = target.closest<HTMLElement>("[data-action]");
    const cellTarget = target.closest<HTMLElement>(".cell");

    if (actionTarget !== null) {
      const action = actionTarget.dataset.action;
      if (action === "restart") controller.reset();
      if (action === "mode-vs-computer") controller.setMode("vs-computer");
      if (action === "mode-vs-player") controller.setMode("vs-player");
      if (action === "rotate") controller.rotateShip();
      if (action === "randomize") controller.randomizeCurrentPlayerFleet();
      if (action === "clear-fleet") controller.clearCurrentPlayerFleet();
      if (action === "complete-setup") controller.completeCurrentSetupPhase();
      if (action === "confirm-interstitial") controller.confirmInterstitial();
      if (action === "end-turn") controller.endCurrentTurn();
      if (action === "select-ship" && actionTarget.dataset.shipId !== undefined) {
        controller.selectShip(actionTarget.dataset.shipId);
      }
      repaint();
      queueComputerTurn();
      return;
    }

    if (cellTarget === null) {
      return;
    }

    const row = Number(cellTarget.dataset.row);
    const col = Number(cellTarget.dataset.col);
    const board = cellTarget.dataset.board;
    if (Number.isNaN(row) || Number.isNaN(col)) {
      return;
    }

    const state = controller.getViewState();
    if (state.phase === "setup" && board === "self") {
      if (state.canStartBattle) {
        return;
      }
      controller.placeShipAt(row, col);
      repaint();
      return;
    }

    if (state.phase === "battle" && board === "enemy") {
      if (!cellTarget.classList.contains("cell-targetable")) {
        return;
      }
      controller.attack(row, col);
      repaint();
      queueComputerTurn();
    }
  });

  root.addEventListener("dragstart", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const isBoardShipDrag =
      target.closest<HTMLElement>(".cell[data-can-drag-ship='true']") !== null;
    const shipButton = target.closest<HTMLElement>("[data-ship-id]");
    if (shipButton === null) {
      return;
    }
    if (
      shipButton instanceof HTMLButtonElement &&
      (shipButton.disabled || shipButton.draggable === false)
    ) {
      event.preventDefault();
      draggingShipId = null;
      return;
    }
    draggingShipId = shipButton.dataset.shipId ?? null;
    if (draggingShipId !== null && isBoardShipDrag) {
      controller.selectShip(draggingShipId);
      controller.alignOrientationToPlacedShip(draggingShipId);
    }
    if (event.dataTransfer !== null && draggingShipId !== null) {
      event.dataTransfer.setData("text/plain", draggingShipId);
    }
    if (draggingShipId !== null) {
      applyOriginShipHighlight(draggingShipId);
    }
  });

  root.addEventListener("dragend", () => {
    clearPlacementPreview();
    clearOriginShipHighlight();
    lastHoverCoord = null;
    rightRotateLocked = false;
    draggingShipId = null;
  });

  root.addEventListener("contextmenu", (event) => {
    const state = controller.getViewState();
    if (state.phase !== "setup") {
      return;
    }
    event.preventDefault();
    controller.rotateShip();
    repaint();
    refreshDragVisualsAfterRepaint();
  });

  root.addEventListener("dragover", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const dropCell = target.closest<HTMLElement>("[data-can-drop='true']");
    if (dropCell !== null) {
      event.preventDefault();
      const row = Number(dropCell.dataset.row);
      const col = Number(dropCell.dataset.col);
      if (!Number.isNaN(row) && !Number.isNaN(col)) {
        const rightMouseHeld = (event.buttons & 2) === 2;
        if (draggingShipId !== null && rightMouseHeld && !rightRotateLocked) {
          controller.rotateShip();
          repaint();
          refreshDragVisualsAfterRepaint();
          rightRotateLocked = true;
        }
        if (!rightMouseHeld) {
          rightRotateLocked = false;
        }
        lastHoverCoord = { row, col };
        applyPlacementPreview(row, col);
      }
    } else {
      clearPlacementPreview();
      lastHoverCoord = null;
      rightRotateLocked = false;
    }
  });

  root.addEventListener("mousemove", (event) => {
    if (draggingShipId !== null) {
      return;
    }
    const state = controller.getViewState();
    if (state.phase !== "setup" || state.canStartBattle) {
      clearPlacementPreview();
      lastHoverCoord = null;
      return;
    }
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const hoverCell = target.closest<HTMLElement>("[data-can-drop='true']");
    if (hoverCell === null) {
      clearPlacementPreview();
      lastHoverCoord = null;
      return;
    }
    const row = Number(hoverCell.dataset.row);
    const col = Number(hoverCell.dataset.col);
    if (Number.isNaN(row) || Number.isNaN(col)) {
      return;
    }
    lastHoverCoord = { row, col };
    applyPlacementPreview(row, col);
  });

  root.addEventListener("drop", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const dropCell = target.closest<HTMLElement>("[data-can-drop='true']");
    if (dropCell === null) {
      return;
    }
    event.preventDefault();
    const row = Number(dropCell.dataset.row);
    const col = Number(dropCell.dataset.col);
    if (Number.isNaN(row) || Number.isNaN(col)) {
      return;
    }
    const payload = event.dataTransfer?.getData("text/plain");
    const shipId = payload || draggingShipId;
    clearPlacementPreview();
    clearOriginShipHighlight();
    lastHoverCoord = null;
    if (shipId !== null) {
      controller.placeShipAt(row, col, shipId);
      repaint();
    }
    draggingShipId = null;
  });

  repaint();
  queueComputerTurn();
}
