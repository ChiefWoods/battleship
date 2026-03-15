import { describe, expect, it } from "vitest";
import { GameController } from "../../src/game/GameController.ts";

describe("GameController", () => {
  it("starts in setup mode", () => {
    const controller = new GameController("vs-computer");
    const state = controller.getViewState();
    expect(state.phase).toBe("setup");
    expect(state.canStartBattle).toBe(false);
  });

  it("stays in setup after randomizing in vs-computer", () => {
    const controller = new GameController("vs-computer");
    controller.randomizeCurrentPlayerFleet();

    const state = controller.getViewState();
    expect(state.phase).toBe("setup");
    expect(state.canStartBattle).toBe(true);
  });

  it("enters battle after confirming randomized setup in vs-computer", () => {
    const controller = new GameController("vs-computer");
    controller.randomizeCurrentPlayerFleet();
    const advanced = controller.completeCurrentSetupPhase();

    const state = controller.getViewState();
    expect(advanced).toBe(true);
    expect(state.phase).toBe("battle");
    expect(state.activePlayer).toBe("player-1");
  });

  it("creates pass-device interstitial in 2-player setup handoff", () => {
    const controller = new GameController("vs-player");
    controller.randomizeCurrentPlayerFleet();
    const advanced = controller.completeCurrentSetupPhase();
    const state = controller.getViewState();

    expect(advanced).toBe(true);
    expect(state.phase).toBe("setup");
    expect(state.setupPlayer).toBe("player-2");
    expect(state.interstitial).not.toBeNull();
  });

  it("allows attack during battle and rejects duplicate target", () => {
    const controller = new GameController("vs-computer");
    controller.randomizeCurrentPlayerFleet();
    controller.completeCurrentSetupPhase();
    const firstState = controller.getViewState();
    const firstTarget = firstState.enemyBoard.find((cell) => cell.canTarget);
    expect(firstTarget).toBeDefined();
    if (firstTarget === undefined) {
      return;
    }

    const first = controller.attack(firstTarget.row, firstTarget.col);
    const duplicate = controller.attack(firstTarget.row, firstTarget.col);

    expect(first).toBe(true);
    expect(duplicate).toBe(false);
  });

  it("requires explicit end turn in 2-player battle", () => {
    const controller = new GameController("vs-player");
    controller.randomizeCurrentPlayerFleet();
    controller.completeCurrentSetupPhase();
    controller.confirmInterstitial();
    controller.randomizeCurrentPlayerFleet();
    controller.completeCurrentSetupPhase();
    controller.confirmInterstitial();

    const stateBefore = controller.getViewState();
    const target = stateBefore.enemyBoard.find((cell) => cell.canTarget);
    expect(target).toBeDefined();
    if (target === undefined) {
      return;
    }

    controller.attack(target.row, target.col);
    const stateAfterAttack = controller.getViewState();
    expect(stateAfterAttack.interstitial).toBeNull();
    expect(stateAfterAttack.canEndTurn).toBe(true);

    const ended = controller.endCurrentTurn();
    const stateAfterEndTurn = controller.getViewState();
    expect(ended).toBe(true);
    expect(stateAfterEndTurn.interstitial).not.toBeNull();
    expect(stateAfterEndTurn.activePlayer).toBe("player-2");
  });
});
