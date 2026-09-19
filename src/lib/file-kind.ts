/** Fayl turi — URL kengaytmasi bo'yicha (query/hash e'tiborga olinmaydi). */

function ext(url: string | null | undefined): string {
  if (!url) return '';
  return url.split('?')[0].split('#')[0].toLowerCase();
}

export function isPdf(url: string | null | undefined): boolean {
  return ext(url).endsWith('.pdf');
}

export function isDocx(url: string | null | undefined): boolean {
  return ext(url).endsWith('.docx');
}
