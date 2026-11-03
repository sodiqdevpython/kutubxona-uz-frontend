// Brauzerdagi qidiruv uchun matnni bitta shaklga keltiradi: apostrof turlari va
// kirill/lotin farqi yo'qoladi. Server tomoni: backend/utils/search.py.

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'x', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ы: 'i', э: 'e', ю: 'yu', я: 'ya',
  ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h', і: 'i', һ: 'h',
};

export function foldText(text: string): string {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/['‘’ʻʼ`´ʹ′ъь]/g, '')
    .replace(/[а-яёўқғҳіһ]/g, ch => CYRILLIC_TO_LATIN[ch] ?? ch)
    .replace(/ye/g, 'e');
}
