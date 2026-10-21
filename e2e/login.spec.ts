import { expect, test } from "@playwright/test";
import { E2E_ACCOUNTS } from "./accounts";
import { login } from "./agenda";

test("LOG-01 entrar com e-mail e senha", async ({ page }) => {
  await login(page, E2E_ACCOUNTS.manager.username, E2E_ACCOUNTS.manager.password);
  await expect(page).toHaveURL(/\/reservas/);
  await expect(page.getByRole("link", { name: /Quadra 1/ }).first()).toBeVisible();
});
