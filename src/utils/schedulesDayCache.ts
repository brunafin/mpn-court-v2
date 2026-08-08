import type { IReservationItemProps } from "../pages/Reservation/interface";

type DayCacheEntry = {
  list: IReservationItemProps[];
  courtsNameList: string[];
  fetchedAt: number;
};

/** Quantos dias distintos manter na memória do browser. */
const MAX_DAYS = 14;

/**
 * Abaixo disso, ao voltar no dia não refetch (navegação instantânea).
 * Acima: pinta do cache e revalida em background sem spinner.
 */
const FRESH_MS = 15_000;

const store = new Map<string, DayCacheEntry>();

function keyOf(companyPublicId: string, date: string) {
  return `${companyPublicId}:${date}`;
}

function touchLru(key: string, entry: DayCacheEntry) {
  // Map preserva ordem de inserção — reinserir = “mais recente”
  store.delete(key);
  store.set(key, entry);
  while (store.size > MAX_DAYS) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}

export function getSchedulesDayCache(
  companyPublicId: string,
  date: string,
): DayCacheEntry | null {
  const key = keyOf(companyPublicId, date);
  const entry = store.get(key);
  if (!entry) return null;
  touchLru(key, entry);
  return entry;
}

export function isSchedulesDayCacheFresh(
  companyPublicId: string,
  date: string,
  freshMs = FRESH_MS,
): boolean {
  const entry = store.get(keyOf(companyPublicId, date));
  if (!entry) return false;
  return Date.now() - entry.fetchedAt < freshMs;
}

export function setSchedulesDayCache(
  companyPublicId: string,
  date: string,
  list: IReservationItemProps[],
  courtsNameList: string[],
): void {
  const key = keyOf(companyPublicId, date);
  touchLru(key, {
    list,
    courtsNameList,
    fetchedAt: Date.now(),
  });
}

/** Invalida um dia, toda a empresa, ou tudo. */
export function invalidateSchedulesDayCache(
  companyPublicId?: string,
  date?: string,
): void {
  if (companyPublicId && date) {
    store.delete(keyOf(companyPublicId, date));
    return;
  }
  if (companyPublicId) {
    for (const key of [...store.keys()]) {
      if (key.startsWith(`${companyPublicId}:`)) {
        store.delete(key);
      }
    }
    return;
  }
  store.clear();
}

/**
 * Atualiza um slot no cache do dia (evita skeleton após mutação).
 * Com `clearOtherDays`, limpa outros dias da empresa (fix/unfix afetam futuros)
 * e regrava o dia atual patchado.
 */
export function patchSchedulesDayCacheSlot(
  companyPublicId: string,
  date: string,
  scheduleId: string,
  patch: Partial<IReservationItemProps>,
  opts?: { clearOtherDays?: boolean },
): boolean {
  const cached = getSchedulesDayCache(companyPublicId, date);
  if (!cached) {
    if (opts?.clearOtherDays) {
      invalidateSchedulesDayCache(companyPublicId);
    }
    return false;
  }

  const list = cached.list.map((item) =>
    item.scheduleId === scheduleId ? { ...item, ...patch } : item,
  );

  if (opts?.clearOtherDays) {
    invalidateSchedulesDayCache(companyPublicId);
  }

  setSchedulesDayCache(companyPublicId, date, list, cached.courtsNameList);
  return true;
}
