import "./style.css";
import { GameController } from "./game/GameController.ts";
import { bindEvents } from "./ui/events.ts";

const root = document.querySelector<HTMLDivElement>("#app");

if (root === null) {
  throw new Error("#app root element was not found.");
}

const controller = new GameController("vs-computer");
bindEvents({
  root,
  controller,
});
