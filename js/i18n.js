/** Словарь интерфейса. Добавить язык: registerLang('en', {...}) и setLang('en'). */

const dict = {
  ru: {
    'a11y.skip': 'К содержимому',
    'brand.name': 'Speakyz',
    'nav.catalog': 'Каталог',
    'nav.tutors': 'Стать репетитором',
    'nav.menu': 'Меню',
    'theme.toggle': 'Сменить тему оформления',
    'common.close': 'Закрыть',
    'common.cancel': 'Отмена',
    'common.confirm': 'Подтвердить',
    'common.or': 'или',

    'auth.login': 'Войти',
    'auth.register': 'Регистрация',
    'auth.logout': 'Выйти',
    'auth.cabinet': 'Мои заявки',
    'auth.profile': 'Анкета репетитора',
    'auth.admin': 'Модерация',
    'auth.account': 'Аккаунт',
    'auth.email': 'Email',
    'auth.password': 'Пароль',
    'auth.password.hint': 'Не короче 8 символов',
    'auth.name': 'Как вас зовут',
    'auth.google': 'Продолжить с Google',
    'auth.forgot': 'Забыли пароль?',
    'auth.consent.pre': 'Принимаю',
    'auth.consent.terms': 'Условия',
    'auth.consent.and': 'и',
    'auth.consent.privacy': 'Политику конфиденциальности',
    'auth.submit.login': 'Войти',
    'auth.submit.register': 'Создать аккаунт',
    'auth.registered': 'Аккаунт создан. Мы отправили письмо для подтверждения email.',
    'auth.reset.sent': 'Письмо со ссылкой для сброса пароля отправлено на {email}.',
    'auth.reset.need_email': 'Введите email выше, и мы отправим ссылку для сброса пароля.',
    'auth.verify.text': 'Подтвердите email, чтобы отправлять заявки и видеть контакты репетиторов.',
    'auth.verify.resend': 'Отправить письмо ещё раз',
    'auth.verify.check': 'Я подтвердил(а)',
    'auth.verify.sent': 'Письмо отправлено на {email}.',
    'auth.verify.ok': 'Email подтверждён.',
    'auth.verify.still': 'Email пока не подтверждён. Проверьте почту и папку «Спам».',
    'auth.banned': 'Аккаунт заблокирован. Если это ошибка, напишите в поддержку.',

    'err.generic': 'Что-то пошло не так. Повторите попытку.',
    'err.not-configured': 'Проект не настроен: заполните js/firebase-config.js.',
    'err.quota': 'Сервис временно перегружен. Показываем сохранённые данные.',
    'err.offline': 'Нет соединения с интернетом. Часть функций недоступна.',
    'err.required': 'Заполните все обязательные поля.',
    'err.email': 'Проверьте адрес email.',
    'err.password-short': 'Пароль должен быть не короче 8 символов.',
    'err.name-short': 'Укажите имя (не короче 2 символов).',
    'err.consent': 'Чтобы создать аккаунт, примите условия.',
    'err.auth.invalid-email': 'Проверьте адрес email.',
    'err.auth.invalid-credential': 'Неверный email или пароль.',
    'err.auth.wrong-password': 'Неверный email или пароль.',
    'err.auth.user-not-found': 'Неверный email или пароль.',
    'err.auth.email-already-in-use': 'Этот email уже зарегистрирован. Войдите или сбросьте пароль.',
    'err.auth.weak-password': 'Пароль слишком простой. Используйте не меньше 8 символов.',
    'err.auth.too-many-requests': 'Слишком много попыток. Подождите несколько минут.',
    'err.auth.network-request-failed': 'Нет соединения с сервером. Проверьте интернет.',
    'err.auth.user-disabled': 'Аккаунт заблокирован.',
    'err.auth.popup-blocked': 'Браузер заблокировал окно входа. Разрешите всплывающие окна для сайта.',
    'err.auth.unauthorized-domain': 'Домен не добавлен в Firebase → Authentication → Authorized domains.',

    'footer.about': 'Репетиторы, с которыми получается. Анкеты проходят проверку модератора.',
    'footer.terms': 'Условия',
    'footer.privacy': 'Конфиденциальность',
    'footer.disclaimer': 'Speakyz не участвует в расчётах за уроки: оплату вы согласуете с репетитором напрямую.',
    'footer.rights': '© {year} Speakyz',

    'home.title': 'Найдите репетитора и начните говорить',
    'home.lead': 'Каждую анкету проверяет модератор. Пишите репетитору напрямую — без скрытых комиссий.',
    'home.cta.find': 'Смотреть репетиторов',
    'home.cta.teach': 'Стать репетитором',

    'nf.title': 'Страница не найдена',
    'nf.text': 'Такой страницы нет или она переехала. Вернитесь в каталог и продолжите поиск.',
    'nf.back': 'В каталог',
  },
};

let lang = 'ru';

/** @param {string} code @param {Record<string,string>} strings */
export function registerLang(code, strings) { dict[code] = { ...(dict[code] || {}), ...strings }; }

/** @param {string} code */
export function setLang(code) { if (dict[code]) { lang = code; document.documentElement.lang = code; } }

/** @param {string} key */
export const has = (key) => key in (dict[lang] || {}) || key in dict.ru;

/**
 * Перевод по ключу с подстановкой {param}. Неизвестный ключ возвращается как есть.
 * @param {string} key
 * @param {Record<string, string|number>} [params]
 */
export function t(key, params) {
  const s = dict[lang]?.[key] ?? dict.ru[key] ?? key;
  return params ? s.replace(/\{(\w+)\}/g, (m, k) => (params[k] ?? m)) : s;
}

/**
 * Русское склонение: plural(5, ['отзыв', 'отзыва', 'отзывов']) → «отзывов».
 * @param {number} n @param {[string,string,string]} forms
 */
export function plural(n, forms) {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  return b === 1 ? forms[0] : forms[2];
}

/**
 * Применяет переводы к разметке: data-i18n="ключ" (текст) и data-i18n-attr="placeholder:ключ;aria-label:ключ".
 * @param {ParentNode} [root]
 */
export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n); });
  root.querySelectorAll('[data-i18n-attr]').forEach((n) => {
    n.dataset.i18nAttr.split(';').forEach((pair) => {
      const [attr, key] = pair.split(':');
      if (attr && key) n.setAttribute(attr.trim(), t(key.trim()));
    });
  });
}
