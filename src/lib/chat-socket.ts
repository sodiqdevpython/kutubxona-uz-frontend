/**
 * Admin chat uchun WebSocket klienti.
 *
 * Ilgari sahifa har 5 sekundda ikkita HTTP so'rov yuborardi (polling): chatlar
 * ro'yxati + aktiv suhbat xabarlari. Endi backend Channels orqali o'zgarishlarni
 * o'zi push qiladi — trafik va baza yuki keskin kamayadi.
 *
 * Xususiyatlari:
 *   • uzilganda eksponensial backoff bilan qayta ulanadi;
 *   • qayta ulanganda `onResync` chaqiriladi (uzilish paytidagi xabarlar
 *     HTTP orqali bir marta yuklab olinadi);
 *   • har 25 s da ping — proksilar ulanishni yopib qo'ymasligi uchun;
 *   • token eskirgan bo'lsa `onAuthError` chaqiriladi (server 4401 kodi bilan
 *     yopadi yoki handshake'ni umuman rad etadi).
 */
import { wsBase } from './config';
import type { AdminChat, ChatMessage } from './admin-api';

export type ChatSocketStatus = 'connecting' | 'open' | 'offline';

export type ChatEvent =
  | { event: 'ready' }
  | { event: 'unauthorized' }
  | { event: 'pong' }
  | { event: 'message.created'; chat_id: string; message: ChatMessage; chat: AdminChat }
  | { event: 'chat.updated';    chat_id: string; chat: AdminChat }
  | { event: 'chat.deleted';    chat_id: string }
  | { event: 'chat.read';       chat_id: string };

interface Handlers {
  onEvent:      (e: ChatEvent) => void;
  onStatus?:    (s: ChatSocketStatus) => void;
  /** Qayta ulanishdan keyin — ma'lumotlarni HTTP orqali yangilash uchun. */
  onResync?:    () => void;
  onAuthError?: () => void;
}

const PING_MS         = 25_000;
const MAX_BACKOFF_MS  = 30_000;
// Hech qachon ochilmay shuncha marta uzilsa — muammo tokenda deb hisoblaymiz
const AUTH_FAIL_LIMIT = 4;

export function connectAdminChat(handlers: Handlers): () => void {
  let socket:     WebSocket | null = null;
  let pingTimer:  ReturnType<typeof setInterval> | null = null;
  let retryTimer: ReturnType<typeof setTimeout>  | null = null;
  let attempt      = 0;   // ketma-ket muvaffaqiyatsiz urinishlar
  let closed       = false;
  let everReady    = false;   // kamida bir marta to'liq ulangan
  let readyNow     = false;   // shu ulanishda 'ready' keldimi

  function clearTimers() {
    if (pingTimer)  { clearInterval(pingTimer);  pingTimer  = null; }
    if (retryTimer) { clearTimeout(retryTimer);  retryTimer = null; }
  }

  function fail() {
    closed = true;
    clearTimers();
    socket?.close();
    socket = null;
    handlers.onAuthError?.();
  }

  function scheduleRetry() {
    if (closed) return;
    attempt += 1;
    // Ulanish hech qachon ochilmayapti — token yaroqsiz bo'lishi mumkin
    if (!everReady && attempt >= AUTH_FAIL_LIMIT) { fail(); return; }
    const delay = Math.min(1000 * 2 ** (attempt - 1), MAX_BACKOFF_MS);
    retryTimer = setTimeout(open, delay);
  }

  function open() {
    if (closed) return;

    const token = localStorage.getItem('kb_admin_access') ?? '';
    if (!token) { handlers.onAuthError?.(); return; }

    readyNow = false;
    handlers.onStatus?.('connecting');

    try {
      socket = new WebSocket(`${wsBase()}/ws/admin/chat/?token=${encodeURIComponent(token)}`);
    } catch {
      scheduleRetry();
      return;
    }

    socket.onmessage = (ev) => {
      let data: ChatEvent;
      try {
        data = JSON.parse(ev.data) as ChatEvent;
      } catch {
        return;   // noto'g'ri payload — e'tiborsiz qoldiramiz
      }

      if (data.event === 'unauthorized') { fail(); return; }

      if (data.event === 'ready') {
        readyNow = true;
        attempt  = 0;
        handlers.onStatus?.('open');
        // Birinchi ulanish emas — uzilish paytida o'tkazib yuborilgan
        // xabarlarni HTTP orqali bir marta yuklab olamiz.
        if (everReady) handlers.onResync?.();
        everReady = true;

        pingTimer = setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ action: 'ping' }));
          }
        }, PING_MS);
        return;
      }

      handlers.onEvent(data);
    };

    socket.onclose = (ev) => {
      clearTimers();
      socket = null;
      if (closed) return;
      handlers.onStatus?.('offline');
      if (ev.code === 4401) { fail(); return; }   // token yaroqsiz
      if (readyNow) attempt = 0;                   // ishlayotgan ulanish uzildi
      scheduleRetry();
    };

    socket.onerror = () => { /* onclose baribir chaqiriladi */ };
  }

  open();

  return () => {
    closed = true;
    clearTimers();
    socket?.close();
    socket = null;
  };
}
