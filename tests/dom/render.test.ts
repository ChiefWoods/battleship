import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/dom";
import { GameController } from "../../src/game/GameController.ts";
import { renderApp } from "../../src/ui/render.ts";

describe("renderApp (DOM)", () => {
  it("renders setup screen and main controls", () => {
    const controller = new GameController("vs-computer");
    document.body.innerHTML = renderApp(controller.getViewState());

    expect(screen.getByRole("heading", { name: "Fleet Setup" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vs Computer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2 Players" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm Fleet" })).toBeDisabled();
  });

  it("renders End Turn button in 2-player battle", () => {
    const controller = new GameController("vs-player");
    controller.randomizeCurrentPlayerFleet();
    controller.completeCurrentSetupPhase();
    controller.confirmInterstitial();
    controller.randomizeCurrentPlayerFleet();
    controller.completeCurrentSetupPhase();
    controller.confirmInterstitial();

    document.body.innerHTML = renderApp(controller.getViewState());
    expect(screen.getByRole("button", { name: "End Turn" })).toBeDisabled();
  });
});
