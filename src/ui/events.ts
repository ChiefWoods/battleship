import { GameController } from "../game/GameController.ts";
import { renderApp } from "./render.ts";

interface EventBinderOptions {
  root: HTMLElement;
  controller: GameController;
}

export function bindEvents({ root, controller }: EventBinderOptions): void {
  let draggingShipId: string | null = null;

  function repaint(): void {
    root.innerHTML = renderApp(controller.getViewState());
  }

  function queueComputerTurn(): void {
    const state = controller.getViewState();
    if (state.phase !== "battle" || state.activePlayer !== "player-2") {
      return;
    }
    window.setTimeout(() => {
      controller.runComputerTurnIfNeeded();
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
      controller.placeShipAt(row, col);
      repaint();
      return;
    }

    if (state.phase === "battle" && board === "enemy") {
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
    const shipButton = target.closest<HTMLElement>("[data-ship-id]");
    if (shipButton === null) {
      return;
    }
    draggingShipId = shipButton.dataset.shipId ?? null;
    if (event.dataTransfer !== null && draggingShipId !== null) {
      event.dataTransfer.setData("text/plain", draggingShipId);
    }
  });

  root.addEventListener("dragover", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const dropCell = target.closest<HTMLElement>("[data-can-drop='true']");
    if (dropCell !== null) {
      event.preventDefault();
    }
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
    if (shipId !== null) {
      controller.placeShipAt(row, col, shipId);
      controller.selectShip(shipId);
      repaint();
    }
    draggingShipId = null;
  });

  repaint();
  queueComputerTurn();
}
