import { expect, test } from "@playwright/test";
import { openBooked, openSlot, reserve } from "./agenda";
import { addDays, brazilToday } from "./dates";

const today = brazilToday();

test("RES-03 reservar sem telefone", async ({ page }) => {
  await openSlot(page, addDays(today, 2), "10:00");
  await reserve(page, "Cliente Avulso");
  await openBooked(page, "Cliente Avulso");
  const card = page.getByRole("group", { name: "Cliente Avulso" });
  await expect(card.getByRole("link", { name: /WhatsApp/ })).toHaveCount(0);
});

test("RES-12 reservar escolhendo esporte", async ({ page }) => {
  await openSlot(page, addDays(today, 2), "11:00");
  await page.locator("#name").fill("Com Esporte");
  await page.locator("#court-sport").selectOption({ label: "Futsal" });
  await page.getByRole("button", { name: "Reservar horário" }).click();
  await expect(page.getByRole("link", { name: /Com Esporte/ })).toBeVisible();
  await openBooked(page, "Com Esporte");
  await expect(
    page.getByRole("combobox", { name: "Esporte" }).locator("option:checked"),
  ).toHaveText("Futsal");
});

test("RES-08 a tela não mostra prepago", async ({ page }) => {
  await openSlot(page, addDays(today, 2), "12:00");
  await expect(page.getByLabel("Nome")).toBeVisible();
  await expect(page.getByText(/pr[eé]-?pago/i)).toHaveCount(0);
});

test("RES-04 editar contato removendo telefone", async ({ page }) => {
  await openSlot(page, addDays(today, 3), "10:00");
  await reserve(page, "Com Fone", "51977776666");
  await openBooked(page, "Com Fone");
  await page.getByRole("button", { name: "Editar contato" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Telefone com DDD").fill("");
  await dialog.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("link", { name: /WhatsApp/ })).toHaveCount(0);
});
