import { m, type Entry } from './types';

/** Login, 404, xato tutgich, CAPTCHA. */
export default {
  'login.eyebrow':  m('Kirish', 'Кириш', 'Вход', 'Sign in'),
  'login.note1':    m('Faqat tahrir xodimlari uchun.', 'Фақат таҳрир ходимлари учун.', 'Только для сотрудников редакции.', 'For editorial staff only.'),
  'login.note2':    m('Parolingizni unutgan bo‘lsangiz Django admin orqali tiklang.', 'Паролингизни унутган бўлсангиз Django admin орқали тикланг.', 'Если вы забыли пароль, восстановите его через Django admin.', 'If you forgot your password, reset it via Django admin.'),
  'login.username': m('Foydalanuvchi nomi', 'Фойдаланувчи номи', 'Имя пользователя', 'Username'),
  'login.password': m('Parol', 'Парол', 'Пароль', 'Password'),
  'login.checking': m('Tekshirilmoqda…', 'Текширилмоқда…', 'Проверка…', 'Checking…'),
  'login.submit':   m('Kirish', 'Кириш', 'Войти', 'Sign in'),
  'login.error':    m('Login xatosi', 'Логин хатоси', 'Ошибка входа', 'Login error'),

  'notfound.doc_title': m('Sahifa topilmadi · Kutubxona.uz', 'Саҳифа топилмади · Kutubxona.uz', 'Страница не найдена · Kutubxona.uz', 'Page not found · Kutubxona.uz'),
  'notfound.title':     m('Sahifa topilmadi', 'Саҳифа топилмади', 'Страница не найдена', 'Page not found'),
  'notfound.text': m(
    '{path} manzilida sahifa yo‘q — u ko‘chirilgan, o‘chirilgan yoki manzil noto‘g‘ri terilgan bo‘lishi mumkin.',
    '{path} манзилида саҳифа йўқ — у кўчирилган, ўчирилган ёки манзил нотўғри терилган бўлиши мумкин.',
    'По адресу {path} страницы нет — возможно, она перемещена, удалена или адрес введён с ошибкой.',
    'There is no page at {path} — it may have been moved or deleted, or the address was mistyped.',
  ),
  'notfound.search_placeholder': m('Maqola, muallif yoki kalit so‘z bo‘yicha qidirish…', 'Мақола, муаллиф ёки калит сўз бўйича қидириш…', 'Поиск по статье, автору или ключевому слову…', 'Search by article, author or keyword…'),
  'notfound.home':      m('← Bosh sahifa', '← Бош саҳифа', '← Главная', '← Home'),

  'eb.label':  m('Xatolik', 'Хатолик', 'Ошибка', 'Error'),
  'eb.title':  m('Sahifa xatolik bilan to‘xtadi', 'Саҳифа хатолик билан тўхтади', 'Страница остановилась с ошибкой', 'The page stopped with an error'),
  'eb.text':   m(
    'Sahifani qayta yuklab ko‘ring. Xato takrorlansa, quyidagi matnni tahririyat dasturchisiga yuboring.',
    'Саҳифани қайта юклаб кўринг. Хато такрорланса, қуйидаги матнни таҳририят дастурчисига юборинг.',
    'Попробуйте перезагрузить страницу. Если ошибка повторится, отправьте текст ниже разработчику редакции.',
    'Try reloading the page. If the error persists, send the text below to the editorial developer.',
  ),
  'eb.reload': m('Qayta yuklash', 'Қайта юклаш', 'Перезагрузить', 'Reload'),
  'eb.home':   m('Bosh sahifa', 'Бош саҳифа', 'Главная', 'Home'),
  'eb.admin':  m('Admin panel', 'Админ панел', 'Админ-панель', 'Admin panel'),

  'captcha.load_failed': m('Tekshiruv vidjetini yuklab bo‘lmadi.', 'Текширув виджетини юклаб бўлмади.', 'Не удалось загрузить виджет проверки.', 'Could not load the verification widget.'),
} satisfies Record<string, Entry>;
