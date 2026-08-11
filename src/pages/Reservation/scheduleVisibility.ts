/**
 * Visibilidade do slot em relação à grade / portal.
 * - true: OS público (comercial)
 * - false: OS interno (não lista no site)
 * - null/undefined: sem OS (órfão / quick-create)
 */
export type SchedulePublicFlag = boolean | null | undefined;

/** Já é horário interno na grade. */
export function isInternalSchedule(isPublic: SchedulePublicFlag): boolean {
  return isPublic === false;
}

/**
 * Fixar este slot cria/mantém série interna
 * (órfão fora da grade ou OS já interno).
 */
export function willFixAsInternal(isPublic: SchedulePublicFlag): boolean {
  return isPublic !== true;
}
