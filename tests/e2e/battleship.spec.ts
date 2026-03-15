import { expect, test, type Page } from "@playwright/test";

function enemyGrid(page: Page) {
  return page.locator(".grid[data-grid='enemy']");
}

function selfGrid(page: Page) {
  return page.locator(".grid[data-grid='self']");
}

test.describe("Battleship app", () => {
  test("renders initial setup screen", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Fleet Setup" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Vs Computer" })).toBeVisible();
    await expect(page.getByRole("button", { name: "2 Players" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirm Fleet" })).toBeDisabled();
  });

  test("starts vs-computer battle from randomize and allows attacks", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Randomize" }).click();
    await expect(page.getByRole("heading", { name: "Engagement" })).toBeVisible();
    await expect(page.getByText("Enemy Waters")).toBeVisible();

    const firstTarget = enemyGrid(page).locator(".cell-targetable").first();
    await expect(firstTarget).toBeVisible();

    const row = await firstTarget.getAttribute("data-row");
    const col = await firstTarget.getAttribute("data-col");

    await firstTarget.click();
    const attackedCell = enemyGrid(page).locator(`.cell[data-row='${row}'][data-col='${col}']`);
    await expect(attackedCell).toBeVisible();
    await expect(attackedCell).not.toHaveClass(/cell-targetable/);
    await expect(attackedCell).toHaveClass(/cell-hit|cell-miss/);
  });

  test("supports two-player pass-device setup and battle handoff", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "2 Players" }).click();
    await page.getByRole("button", { name: "Randomize" }).click();
    await page.getByRole("button", { name: "Confirm Fleet" }).click();

    await expect(page.getByRole("heading", { name: "Pass Device" })).toBeVisible();
    await page.getByRole("button", { name: "Begin Player 2 Setup" }).click();
    await expect(page.getByText("Deploying: PLAYER 2")).toBeVisible();

    await page.getByRole("button", { name: "Randomize" }).click();
    await page.getByRole("button", { name: "Confirm Fleet" }).click();

    await expect(page.getByRole("heading", { name: "Pass Device" })).toBeVisible();
    await page.getByRole("button", { name: "Begin Battle" }).click();
    await expect(page.getByRole("heading", { name: "Engagement" })).toBeVisible();

    const p1Target = enemyGrid(page).locator(".cell-targetable").first();
    await expect(p1Target).toBeVisible();
    await p1Target.click();
    await expect(page.getByRole("heading", { name: "Pass Device" })).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();

    // After handoff, player 2 acts against the opposing board.
    await expect(selfGrid(page).locator(".cell-targetable").first()).toBeVisible();
  });
});
