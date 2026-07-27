export enum ReservationStatusEnum {
  FIXED = "fixed",
  INACTIVE = "inactive",
  RESERVED = "reserved",
  AVAILABLE = "available",
}

/** Normaliza status legado (ex.: prepaid) para o vocabulário atual da UI. */
export function normalizeReservationStatus(
  status: string | null | undefined
): ReservationStatusEnum | null {
  if (!status) return null;
  if (status === "prepaid") return ReservationStatusEnum.RESERVED;
  if (
    Object.values(ReservationStatusEnum).includes(
      status as ReservationStatusEnum
    )
  ) {
    return status as ReservationStatusEnum;
  }
  return null;
}

export function isBookedStatus(status: ReservationStatusEnum | null | undefined) {
  return (
    status === ReservationStatusEnum.FIXED ||
    status === ReservationStatusEnum.RESERVED
  );
}