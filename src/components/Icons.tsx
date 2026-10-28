// Phosphor icons (MIT), behind one small adapter so every call site keeps the same API.
import {
  ArrowDown as PArrowDown,
  ArrowUpRight as PArrowUpRight,
  Check as PCheck,
  Code as PCode,
  Copy as PCopy,
  DownloadSimple,
  EnvelopeSimple,
  Lock as PLock,
  LockOpen as PLockOpen,
  MapPin,
  Moon as PMoon,
  SealCheck,
  User,
  X,
  type Icon as PhosphorIcon,
  type IconWeight,
} from "@phosphor-icons/react";

type P = { className?: string };

const icon =
  (I: PhosphorIcon, weight: IconWeight = "regular") =>
  ({ className = "w-4 h-4" }: P) => <I className={className} weight={weight} aria-hidden />;

export const ArrowUpRight = icon(PArrowUpRight);
export const ArrowDown = icon(PArrowDown);
export const Mail = icon(EnvelopeSimple);
export const Pin = icon(MapPin);
export const Copy = icon(PCopy);
export const Check = icon(PCheck, "bold");
export const Close = icon(X);
export const Code = icon(PCode);
export const Person = icon(User);
export const Badge = icon(SealCheck);
export const Download = icon(DownloadSimple);
export const Moon = icon(PMoon, "fill");
export const Lock = icon(PLock);
export const LockOpen = icon(PLockOpen);
