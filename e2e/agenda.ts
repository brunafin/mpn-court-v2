import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { API_URL, E2E_ACCOUNTS } from "./accounts";
import { dateKey, stripLabel } from "./dates";

type ScheduleItem = {
  scheduleId: string;
  time: string;
  court: string;
  status: string;
  customerName: string | null;
};

export async function login(page: Page, username: string, password: string) {
  await page.goto("/");
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.waitForURL((url) => url.pathname !== "/");
}

export async function openDay(page: Page, date: Date) {
  await page.goto("/reservas");
  const day = page.getByRole("button", { name: stripLabel(date), exact: true });
  await expect(day.last()).toBeVisible();
  await day.last().click();
}

export async function openSlot(page: Page, date: Date, hour: string, court = "Quadra 1") {
  await openDay(page, date);
  const slot = page.getByRole("link", {
    name: new RegExp(`${hour}.*${court}`),
  });
  await expect(slot.first()).toBeVisible();
  await slot.first().click();
}

export async function chooseSport(page: Page) {
  const sport = page.locator("#court-sport");
  if ((await sport.count()) === 0) return;
  const tag = await sport.evaluate((element) => element.tagName);
  if (tag === "SELECT") {
    await sport.selectOption({ label: "Futsal" });
  }
}

export async function reserve(page: Page, name: string, phone?: string) {
  await page.locator("#name").fill(name);
  if (phone) {
    await page.locator("#phone").fill(phone);
  }
  await chooseSport(page);
  await page.getByRole("button", { name: "Reservar horário" }).click();
  await expect(page.getByRole("link", { name: new RegExp(name) })).toBeVisible();
}

export async function openBooked(page: Page, name: string) {
  await page.getByRole("link", { name: new RegExp(name) }).click();
  await expect(page.getByRole("button", { name: "Cancelar reserva" })).toBeVisible();
}

export async function confirmDialog(page: Page, label: string) {
  const dialog = page.getByRole("alertdialog");
  await dialog.getByRole("button", { name: label }).click();
}

export async function expectFixedOnAgenda(page: Page, name: string) {
  await expect(
    page.getByRole("link", { name: new RegExp(`Fixo\\..*${name}`) }),
  ).toBeVisible();
}

export async function managerToken(request: APIRequestContext) {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: {
      username: E2E_ACCOUNTS.manager.username,
      password: E2E_ACCOUNTS.manager.password,
    },
  });
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as { access_token: string };
  return body.access_token;
}

function companyIdFromToken(token: string): string {
  const payload = JSON.parse(
    Buffer.from(token.split(".")[1], "base64url").toString(),
  ) as { companyPublicId?: string };
  if (!payload.companyPublicId) {
    throw new Error("Token sem companyPublicId.");
  }
  return payload.companyPublicId;
}

export async function scheduleOn(
  request: APIRequestContext,
  token: string,
  date: Date,
  hour: string,
  court = "Quadra 1",
): Promise<ScheduleItem> {
  const companyId = companyIdFromToken(token);
  const response = await request.get(
    `${API_URL}/companies/${companyId}/schedules/${dateKey(date)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  expect(response.ok()).toBeTruthy();
  const items = (await response.json()) as ScheduleItem[];
  const slot = items.find((item) => item.time === hour && item.court === court);
  if (!slot) {
    throw new Error(`Slot ${hour} ${court} ausente em ${dateKey(date)}`);
  }
  return slot;
}

export async function reserveViaApi(
  request: APIRequestContext,
  token: string,
  scheduleId: string,
  contactName: string,
) {
  const details = await request.get(`${API_URL}/court-schedules/${scheduleId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(details.ok()).toBeTruthy();
  const body = (await details.json()) as {
    sports?: { id: number; name: string }[];
  };
  const sport = body.sports?.find((item) => item.name === "Futsal") ?? body.sports?.[0];
  if (!sport) throw new Error("Esporte ausente no horário.");

  const created = await request.post(`${API_URL}/reservation`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      contactName,
      courtSchedulePublicId: scheduleId,
      sportId: sport.id,
    },
  });
  expect(created.status()).toBe(201);
}
