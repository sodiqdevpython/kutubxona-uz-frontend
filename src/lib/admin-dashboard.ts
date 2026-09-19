/**
 * Boshqaruv paneli ma'lumotlari — bitta so'rov, 60 s kesh, barcha admin
 * sahifalari (sidebar badge'lari, bildirishnomalar, dashboard) baham ko'radi.
 */
import { useEffect, useState } from 'react';
import { adminApi, type AdminDashboard } from './admin-api';

const TTL = 60_000;
const SEEN_KEY = 'kb_admin_notif_seen';

let cache: { data: AdminDashboard; at: number } | null = null;
let inflight: Promise<AdminDashboard> | null = null;
const listeners = new Set<(d: AdminDashboard) => void>();

export function getDashboard(force = false): Promise<AdminDashboard> {
  if (!force && cache && Date.now() - cache.at < TTL) return Promise.resolve(cache.data);
  if (inflight && !force) return inflight;
  inflight = adminApi.dashboard(force)
    .then(d => { cache = { data: d, at: Date.now() }; listeners.forEach(l => l(d)); return d; })
    .finally(() => { inflight = null; });
  return inflight;
}

/** Tasdiqlash/rad etish kabi amallardan keyin — badge va navbat yangilansin. */
export function refreshDashboard(): void {
  getDashboard(true).catch(() => {});
}

export function useDashboard(): AdminDashboard | null {
  const [data, setData] = useState<AdminDashboard | null>(cache?.data ?? null);
  useEffect(() => {
    listeners.add(setData);
    getDashboard().then(setData).catch(() => {});
    return () => { listeners.delete(setData); };
  }, []);
  return data;
}

// ── Bildirishnomalar «o'qildi» holati (brauzerda) ────────────────────────────

export function notifSeenAt(): string {
  try { return localStorage.getItem(SEEN_KEY) ?? ''; } catch { return ''; }
}
export function markNotifSeen(latestIso: string): void {
  try { localStorage.setItem(SEEN_KEY, latestIso); } catch { /* ignore */ }
}

// ── Vaqt formatlari (uz) ─────────────────────────────────────────────────────

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
const DAYS   = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba'];

/** «2 soat oldin», «kecha 16:20», «4-avgust» */
export function relTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (diff < 60) return 'hozirgina';
  if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa oldin`;
  if (diff < 86400 && d.getDate() === now.getDate()) return `${Math.floor(diff / 3600)} soat oldin`;
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `kecha ${hhmm}`;
  if (diff < 86400 * 2) return `${Math.floor(diff / 3600)} soat oldin`;
  return `${d.getDate()}-${MONTHS[d.getMonth()]}${d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : ''}`;
}

/** «15-iyul 2026, 09:12» */
export function fullTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()}-${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** «17-AVGUST 2026, DUSHANBA» */
export function todayEyebrow(iso?: string): string {
  const d = iso ? new Date(iso + 'T12:00:00') : new Date();
  return `${d.getDate()}-${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${DAYS[d.getDay()]}`.toUpperCase();
}

export function fmtBytes(n: number | null | undefined): string {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}
