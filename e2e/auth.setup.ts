import { test as setup } from "@playwright/test";
import { E2E_ACCOUNTS } from "./accounts";
import { login } from "./agenda";

const managerState = "e2e/.auth/manager.json";

setup("autentica o gestor da arena", async ({ page }) => {
  await login(page, E2E_ACCOUNTS.manager.username, E2E_ACCOUNTS.manager.password);
  await page.waitForURL(/\/reservas/);
  await page.context().storageState({ path: managerState });
});
