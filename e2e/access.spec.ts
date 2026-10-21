import { expect, test } from "@playwright/test";
import { E2E_ACCOUNTS, E2E_NEW_PASSWORD } from "./accounts";
import { login, openDay } from "./agenda";
import { addDays, brazilToday } from "./dates";

test("ACC-01 trial encerrado bloqueia a agenda", async ({ page }) => {
  await login(page, E2E_ACCOUNTS.trial.username, E2E_ACCOUNTS.trial.password);
  await expect(page.getByText("Teste grátis encerrado")).toBeVisible();
  await expect(page.getByRole("link", { name: /Contrate um plano/ })).toBeVisible();
});

test("ACC-02 conta em modo somente leitura", async ({ page }) => {
  await login(page, E2E_ACCOUNTS.readonly.username, E2E_ACCOUNTS.readonly.password);
  await expect(page.getByText("Mensalidade em aberto")).toBeVisible();
  await openDay(page, addDays(brazilToday(), 1));
  await expect(page.getByRole("link", { name: /Disponível/ }).first()).toBeVisible();
});

test("QUA-01 ativar a quadra no site", async ({ page }) => {
  await login(page, E2E_ACCOUNTS.manager.username, E2E_ACCOUNTS.manager.password);
  await page.goto("/quadras");
  await page.getByRole("button", { name: "Ativar" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Ativar quadra" }).click();
  await expect(page.getByRole("button", { name: "Ocultar" }).first()).toBeVisible();
});

test("LOG-04 criar nova senha obrigatória", async ({ page }) => {
  await login(
    page,
    E2E_ACCOUNTS.mustChange.username,
    E2E_ACCOUNTS.mustChange.password,
  );
  await expect(page).toHaveURL(/\/alterar-senha/);
  await expect(
    page.getByText("Por segurança, defina uma nova senha para continuar."),
  ).toBeVisible();

  await page.goto("/reservas");
  await expect(page).toHaveURL(/\/alterar-senha/);

  await page.locator("#newPassword").fill(E2E_NEW_PASSWORD);
  await page.locator("#confirmPassword").fill(E2E_NEW_PASSWORD);
  await page.getByRole("button", { name: "Salvar senha" }).click();
  await expect(page).toHaveURL(/\/reservas/);
});
