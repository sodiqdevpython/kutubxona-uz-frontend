/**
 * CAPTCHA vidjeti (Cloudflare Turnstile / hCaptcha / reCAPTCHA).
 *
 * Sozlama backenddan olinadi (`GET /api/auth/captcha/`), shuning uchun
 * provayderni almashtirish yoki yoqish uchun **faqat `.env` ni** o'zgartirish
 * kifoya — frontendni qayta qurish shart emas:
 *
 *     CAPTCHA_PROVIDER=turnstile
 *     CAPTCHA_SITE_KEY=0x4AAAAAAA...
 *     CAPTCHA_SECRET_KEY=0x4AAAAAAA...
 *
 * Kalitlar bo'sh bo'lsa vidjet umuman chizilmaydi va `onToken` chaqirilmaydi —
 * login odatdagidek ishlayveradi.
 */
import { useEffect, useRef, useState } from 'react';
import { API_BASE } from '../../lib/config';

export interface CaptchaConfig {
  enabled:         boolean;
  provider?:       string;
  label?:          string;
  site_key?:       string;
  script_url?:     string;
  widget_class?:   string;
  response_field?: string;
}

/** Backenddan CAPTCHA sozlamasini oladi (bir marta keshlanadi). */
let configCache: Promise<CaptchaConfig> | null = null;

export function getCaptchaConfig(): Promise<CaptchaConfig> {
  if (!configCache) {
    configCache = fetch(`${API_BASE}/api/auth/captcha/`)
      .then(r => (r.ok ? r.json() : { enabled: false }))
      .catch(() => ({ enabled: false }));
  }
  return configCache;
}

function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src^="${url}"]`)) { resolve(); return; }
    const el = document.createElement('script');
    el.src = url;
    el.async = true;
    el.defer = true;
    el.onload  = () => resolve();
    el.onerror = () => reject(new Error('CAPTCHA skripti yuklanmadi'));
    document.head.appendChild(el);
  });
}

interface Props {
  /** Token tayyor bo'lganda chaqiriladi (bo'sh satr — tozalandi). */
  onToken: (token: string) => void;
  /** CAPTCHA yoqilganmi — formani bloklash uchun ota komponentga xabar. */
  onReady?: (enabled: boolean) => void;
}

export default function Captcha({ onToken, onReady }: Props) {
  const [config, setConfig] = useState<CaptchaConfig | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const boxRef  = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let alive = true;

    getCaptchaConfig().then(async cfg => {
      if (!alive) return;
      setConfig(cfg);
      onReady?.(cfg.enabled);
      if (!cfg.enabled || !cfg.script_url) return;

      try {
        await loadScript(cfg.script_url);
      } catch {
        if (alive) setError("Tekshiruv vidjetini yuklab bo'lmadi.");
        return;
      }

      // Provayderlar tokenni yashirin input'ga yozadi — uni kuzatamiz.
      // (Har uchala provayder ham shunday ishlaydi, shuning uchun bitta yo'l.)
      const field = cfg.response_field ?? 'cf-turnstile-response';
      let last = '';
      pollRef.current = setInterval(() => {
        const input = document.querySelector<HTMLInputElement>(
          `[name="${field}"]`,
        );
        const value = input?.value ?? '';
        if (value !== last) {
          last = value;
          onToken(value);
        }
      }, 500);
    });

    return () => {
      alive = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!config?.enabled) return null;

  return (
    <div>
      <div
        ref={boxRef}
        className={config.widget_class}
        data-sitekey={config.site_key}
        data-theme="light"
        style={{ minHeight: 65 }}
      />
      {error && (
        <div style={{ fontSize: 12, color: '#DC2626', marginTop: 6 }}>{error}</div>
      )}
    </div>
  );
}
