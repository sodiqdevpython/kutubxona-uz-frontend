/**
 * Boshqaruv paneli ma'lumotlari — bitta so'rov, 60 s kesh, barcha admin
 * sahifalari (sidebar badge'lari, bildirishnomalar, dashboard) baham ko'radi.
 */
import { useEffect, useState } from 'react';
import { adminApi, type AdminDashboard } from './admin-api';
import { fmtBytes as i18nBytes, fmtDate, tr, trn } from './i18n/runtime';

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

// ── Vaqt formatlari (joriy interfeys tilida) ─────────────────────────────────

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** «2 soat oldin», «kecha 16:20», «4-avgust» */
export function relTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return tr('time.just_now');
  if (diff < 3600) return trn('time.minutes_ago', Math.floor(diff / 60));
  if (diff < 86400 && d.getDate() === now.getDate()) return trn('time.hours_ago', Math.floor(diff / 3600));
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return tr('time.yesterday_at', { t: hhmm(d) });
  if (diff < 86400 * 2) return trn('time.hours_ago', Math.floor(diff / 3600));
  return fmtDate(d, d.getFullYear() !== now.getFullYear()
    ? { day: 'numeric', month: 'long', year: 'numeric' }
    : { day: 'numeric', month: 'long' });
}

/** «15-iyul 2026, 09:12» */
export function fullTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${fmtDate(d)}, ${hhmm(d)}`;
}

/** «17-AVGUST 2026, DUSHANBA» */
export function todayEyebrow(iso?: string): string {
  const d = iso ? new Date(iso + 'T12:00:00') : new Date();
  return `${fmtDate(d)}, ${fmtDate(d, { weekday: 'long' })}`.toUpperCase();
}

export function fmtBytes(n: number | null | undefined): string {
  return i18nBytes(n);
}
