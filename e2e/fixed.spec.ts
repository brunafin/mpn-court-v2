import { expect, test } from "@playwright/test";
import { E2E_PAST_CONTACT } from "./accounts";
import {
  confirmDialog,
  expectFixedOnAgenda,
  managerToken,
  openBooked,
  openDay,
  openSlot,
  reserve,
  reserveViaApi,
  scheduleOn,
} from "./agenda";
import { addDays, brazilToday } from "./dates";

const today = brazilToday();

test("RES-11 cancelar reserva em horário passado", async ({ page }) => {
  await openDay(page, addDays(today, -1));
  await page.getByRole("link", { name: new RegExp(E2E_PAST_CONTACT) }).click();
  await page.getByRole("button", { name: "Cancelar reserva" }).click();
  await confirmDialog(page, "Cancelar reserva");
  await expect(page).toHaveURL(/\/reservas\/?$/);
});

test("FIX-01 fixar com telefone", async ({ page }) => {
  await openSlot(page, addDays(today, 4), "10:00");
  await reserve(page, "Fixo Com Fone", "51966665555");
  await openBooked(page, "Fixo Com Fone");
  await page.getByRole("button", { name: "Fixar horário" }).click();
  await confirmDialog(page, "Fixar horário");
  await expectFixedOnAgenda(page, "Fixo Com Fone");
});

test("FIX-02 fixar sem telefone", async ({ page }) => {
  await openSlot(page, addDays(today, 4), "11:00");
  await reserve(page, "Fixo Sem Fone");
  await openBooked(page, "Fixo Sem Fone");
  await expect(
    page.getByRole("group", { name: "Fixo Sem Fone" }).getByRole("link", { name: /WhatsApp/ }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Fixar horário" }).click();
  await confirmDialog(page, "Fixar horário");
  await expectFixedOnAgenda(page, "Fixo Sem Fone");
  await openBooked(page, "Fixo Sem Fone");
  await expect(page.getByRole("link", { name: /WhatsApp/ })).toHaveCount(0);
});

test("FIX-05 conflito ao fixar com outro contato", async ({ page, request }) => {
  const token = await managerToken(request);
  const future = await scheduleOn(request, token, addDays(today, 12), "10:00");
  await reserveViaApi(request, token, future.scheduleId, "Outro Contato");

  await openSlot(page, addDays(today, 5), "10:00");
  await reserve(page, "Primeiro Contato");
  await openBooked(page, "Primeiro Contato");
  await page.getByRole("button", { name: "Fixar horário" }).click();
  await confirmDialog(page, "Fixar horário");
  await expect(page.getByText(/Não é possível fixar/)).toBeVisible();
});

test("FIX-03 liberar fixo", async ({ page }) => {
  await openSlot(page, addDays(today, 6), "10:00");
  await reserve(page, "Para Liberar");
  await openBooked(page, "Para Liberar");
  await page.getByRole("button", { name: "Fixar horário" }).click();
  await confirmDialog(page, "Fixar horário");
  await expectFixedOnAgenda(page, "Para Liberar");
  await openBooked(page, "Para Liberar");
  await page.getByRole("button", { name: "Liberar fixo" }).click();
  await confirmDialog(page, "Liberar fixo");
  await expect(page.getByRole("link", { name: /Disponível\. 10:00\. Quadra 1/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Para Liberar/ })).toHaveCount(0);
});

test("FIX-04 editar contato do fixo propaga", async ({ page, request }) => {
  await openSlot(page, addDays(today, 6), "11:00");
  await reserve(page, "Ana Fixa", "51955554444");
  await openBooked(page, "Ana Fixa");
  await page.getByRole("button", { name: "Fixar horário" }).click();
  await confirmDialog(page, "Fixar horário");
  await expectFixedOnAgenda(page, "Ana Fixa");
  await openBooked(page, "Ana Fixa");

  await page.getByRole("button", { name: "Editar contato" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nome").fill("Ana Nova");
  await dialog.getByLabel("Telefone com DDD").fill("");
  await dialog.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Ana Nova")).toBeVisible();

  const token = await managerToken(request);
  const nextWeek = await scheduleOn(request, token, addDays(today, 13), "11:00");
  expect(nextWeek.customerName).toBe("Ana Nova");
});
