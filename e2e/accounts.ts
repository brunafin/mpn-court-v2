/** Espelho de mpn-api/src/scripts/e2e-accounts.ts */
export const E2E_PASSWORD = "Admin@123";
export const E2E_DEFAULT_PASSWORD = "Mudar@123";
export const E2E_NEW_PASSWORD = "E2eNova@123";

export const E2E_ACCOUNTS = {
  manager: { username: "manager", password: E2E_PASSWORD },
  trial: { username: "trial", password: E2E_PASSWORD },
  readonly: { username: "readonly", password: E2E_PASSWORD },
  mustChange: { username: "mustchange", password: E2E_DEFAULT_PASSWORD },
  pending: { username: "pendente", password: E2E_PASSWORD },
} as const;

export const E2E_PAST_CONTACT = "Cliente Passado";
export const API_URL = "http://127.0.0.1:3011";
