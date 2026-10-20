import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createSchedulesFetchGuard,
  invalidateSchedulesDayCache,
  isSchedulesDayCacheFresh,
  setSchedulesDayCache,
} from "./schedulesDayCache";

afterEach(() => {
  invalidateSchedulesDayCache();
  vi.useRealTimers();
});

describe("cache do dia da agenda", () => {
  it("fica fresco por 15 segundos", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-20T12:00:00.000Z"));
    setSchedulesDayCache("arena", "2026-10-20", [], []);

    expect(isSchedulesDayCacheFresh("arena", "2026-10-20")).toBe(true);

    vi.setSystemTime(new Date("2026-10-20T12:00:14.999Z"));
    expect(isSchedulesDayCacheFresh("arena", "2026-10-20")).toBe(true);

    vi.setSystemTime(new Date("2026-10-20T12:00:15.000Z"));
    expect(isSchedulesDayCacheFresh("arena", "2026-10-20")).toBe(false);
  });

  it("ignora a resposta de um pedido que já foi substituído", () => {
    const guard = createSchedulesFetchGuard();
    const first = guard.start();
    const second = guard.start();

    expect(guard.isCurrent(first)).toBe(false);
    expect(guard.isCurrent(second)).toBe(true);
  });
});
