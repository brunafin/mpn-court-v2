import { IconType } from "react-icons";
import {
  MdCheck,
  MdNotInterested,
  MdOutlineEventAvailable,
  MdOutlineLock,
  MdOutlineLockOpen,
} from "react-icons/md";
import { ReservationStatusEnum } from "./enum";

/** Ícones de status — família Material (outline) para traço uniforme. */
export const StatusIcons = {
  available: MdCheck,
  reserved: MdOutlineEventAvailable,
  fixed: MdOutlineLock,
  inactive: MdNotInterested,
  unlock: MdOutlineLockOpen,
} as const;

export function getStatusIcon(status: ReservationStatusEnum): IconType {
  switch (status) {
    case ReservationStatusEnum.FIXED:
      return StatusIcons.fixed;
    case ReservationStatusEnum.RESERVED:
      return StatusIcons.reserved;
    case ReservationStatusEnum.AVAILABLE:
      return StatusIcons.available;
    case ReservationStatusEnum.INACTIVE:
      return StatusIcons.inactive;
    default:
      return StatusIcons.available;
  }
}
