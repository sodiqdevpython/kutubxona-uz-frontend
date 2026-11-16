import type { Lang } from '../../../context/LangContext';

/** Bitta kalitning to'rt tildagi qiymati. Hammasi majburiy — chala tarjima kompilyatsiyadan o'tmaydi. */
export type Entry = Record<Lang, string>;

/** Qisqa yozuv: m(lotin, kirill, ruscha, inglizcha). */
export function m(uzLatn: string, uzCyrl: string, ru: string, en: string): Entry {
  return { 'uz-latn': uzLatn, 'uz-cyrl': uzCyrl, ru, en };
}
