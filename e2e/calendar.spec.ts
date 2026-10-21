import { expect, test } from "@playwright/test";
import { confirmDialog, openDay } from "./agenda";
import { addDays, brazilToday } from "./dates";

const today = brazilToday();

test("CAL-03 inativar o dia inteiro", async ({ page }) => {
  await openDay(page, addDays(today, 8));
  await page.getByRole("link", { name: "Informações do dia" }).click();
  await page.getByRole("button", { name: "Inativar o dia inteiro" }).click();
  await confirmDialog(page, "Inativar horários livres");
  await expect(page.getByText(/Dia inativado:/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Inativar o dia inteiro" })).toHaveCount(0);
});

test("CAL-04 ativar selecionados", async ({ page }) => {
  await openDay(page, addDays(today, 9));
  await page.getByRole("link", { name: "Informações do dia" }).click();
  await page.getByRole("button", { name: "Inativar o dia inteiro" }).click();
  await confirmDialog(page, "Inativar horários livres");
  await expect(page.getByRole("button", { name: "Selecionar todos" })).toBeVisible();
  await page.getByRole("button", { name: "Selecionar todos" }).click();
  await page.getByRole("button", { name: /Ativar selecionados/ }).click();
  await expect(page.getByText(/reativado/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Inativar o dia inteiro" })).toBeVisible();
});
