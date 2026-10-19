import { useSyncExternalStore } from "react";
import { SECRETS } from "./registry";

/* Found secrets live in the visitor's own browser (localStorage) — nothing is sent anywhere. */

type Found = Record<string, number>; // id -> unix ms when found
export interface Toast {
  id: string;
  key: number;
  /** How many secrets were found at the moment this one unlocked. */
  n: number;
}
interface Snapshot {
  found: Found;
  toasts: Toast[];
}

const KEY = "eo-secrets-v1";
const subs = new Set<() => void>();

function load(): Found {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

let found: Found = load();
let toasts: Toast[] = [];
let snapshot: Snapshot = { found, toasts };

function emit() {
  snapshot = { found: { ...found }, toasts: [...toasts] };
  subs.forEach((f) => f());
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(found));
  } catch {
    /* private mode etc. — progress just won't persist */
  }
}

/** Marks a secret as found. Returns true the first time. */
export function unlock(id: string) {
  if (!SECRETS.some((s) => s.id === id) || found[id]) return false;
  found = { ...found, [id]: Date.now() };
  save();
  toasts = [...toasts, { id, key: Date.now() + Math.random(), n: Object.keys(found).length }];
  emit();
  return true;
}

export function dismissToast(key: number) {
  toasts = toasts.filter((t) => t.key !== key);
  emit();
}

export function resetSecrets() {
  found = {};
  save();
  emit();
}

export function isFound(id: string) {
  return !!found[id];
}

export function useSecrets() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => {
        subs.delete(f);
      };
    },
    () => snapshot,
    () => snapshot
  );
}
