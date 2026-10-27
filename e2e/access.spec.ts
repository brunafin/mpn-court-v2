import { expect, test } from "@playwright/test";
import { E2E_ACCOUNTS, E2E_NEW_PASSWORD } from "./accounts";
import { login, openSlot } from "./agenda";
import { addDays, brazilToday } from "./dates";

test("ACC-01 trial encerrado bloqueia a agenda", async ({ page }) => {
  await login(page, E2E_ACCOUNTS.trial.username, E2E_ACCOUNTS.trial.password);
  await expect(page.getByText("Teste grátis encerrado")).toBeVisible();
  await expect(page.getByRole("link", { name: /Contrate um plano/ })).toBeVisible();
});

test("ACC-02 no 10º dia a modal é a de suspensão, sem o aviso de antes", async ({
  page,
}) => {
  await login(page, E2E_ACCOUNTS.readonly.username, E2E_ACCOUNTS.readonly.password);

  const dialog = page.getByRole("dialog", { name: "Mensalidade pendente" });
  await expect(dialog.getByText("Mensalidade pendente")).toBeVisible();
  await expect(dialog).not.toContainText("está em aberto");
  await expect(dialog).not.toContainText("A partir de");
  await expect(dialog).toContainText(
    "Reservar, cancelar e alterar horários ficam indisponíveis até a regularização da mensalidade",
  );
  await expect(dialog).toContainText(
    "Após a confirmação do pagamento você voltará a ter o acesso de todas as funcionalidades",
  );
  await dialog.getByRole("button", { name: "Entendi" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const banner = page.getByRole("status");
  await expect(banner).toContainText("Mensalidade pendente.");
  await expect(banner).toContainText(
    "Regularize para voltar a ter o acesso completo",
  );

  await page.goto("/quadras");
  await expect(page.getByRole("status")).toContainText("Mensalidade pendente.");

  await page.goto("/mensalidades");
  await expect(page.getByRole("status")).toContainText("Mensalidade pendente.");
  await expect(page.getByText("Atrasado")).toBeVisible();
  await expect(page.getByText("Nenhuma mensalidade ainda")).toHaveCount(0);

  await openSlot(page, addDays(brazilToday(), 1), "08:00");
  await expect(page.getByRole("status")).toContainText("Mensalidade pendente.");
  await expect(page.getByRole("status")).toContainText(
    "Regularize para voltar a ter o acesso completo",
  );
  await expect(page.getByRole("link", { name: "Regularizar pagamento" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reservar horário" })).toHaveCount(0);
  await expect(page.getByLabel("Nome")).toHaveCount(0);
});

test("ACC-04 mensalidade pendente avisa antes do bloqueio", async ({ page }) => {
  await login(page, E2E_ACCOUNTS.pending.username, E2E_ACCOUNTS.pending.password);

  const dialog = page.getByRole("dialog", { name: "Mensalidade pendente" });
  await expect(dialog.getByText("Mensalidade pendente")).toBeVisible();
  await expect(dialog).toContainText("está em aberto");
  await expect(dialog).toContainText("A partir de");
  await expect(dialog).toContainText(
    "as ações de reservar, cancelar e alterar horários ficarão temporariamente suspensas",
  );
  await expect(dialog).toContainText(
    "Após a confirmação do pagamento, tudo continua funcionando normalmente",
  );
  await dialog.getByRole("link", { name: "Regularizar pagamento" }).click();
  await expect(page).toHaveURL(/\/mensalidades/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("ACC-03 arena em dia não mostra o aviso de mensalidade", async ({ page }) => {
  await login(page, E2E_ACCOUNTS.manager.username, E2E_ACCOUNTS.manager.password);
  await expect(page.getByText("Mensalidade em aberto")).toHaveCount(0);
  await openSlot(page, addDays(brazilToday(), 1), "08:00");
  await expect(page.getByRole("button", { name: "Reservar horário" })).toBeVisible();
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
