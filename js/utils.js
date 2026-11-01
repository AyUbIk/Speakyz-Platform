/** Короткие помощники. Весь пользовательский текст попадает в DOM только через textContent / el(). */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/**
 * Возвращает безопасный URL или '#', если схема опасная (javascript:, data:, vbscript:).
 * @param {string} u
 */
export function safeUrl(u) {
  const s = String(u ?? '').trim();
  return /^(javascript|data|vbscript):/i.test(s.replace(/[\u0000-\u001f\s]/g, '')) ? '#' : s;
}

/**
 * Создаёт DOM-элемент. Строки-дети вставляются как текст (никакого innerHTML).
 * @param {string} tag
 * @param {Record<string, any>} [attrs] class, dataset, onclick-подобные обработчики, остальное — атрибуты
 * @param {...(Node|string|number|null|false|Array)} children
 * @returns {HTMLElement}
 */
export function el(tag, attrs = {}, ...children) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'dataset') Object.assign(n.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if (k === 'href' || k === 'src') n.setAttribute(k, safeUrl(v));
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    n.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return n;
}

const ICONS = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
};

/**
 * Встроенная SVG-иконка (статичные доверенные пути, данных пользователя тут нет).
 * @param {keyof ICONS} name
 * @param {number} [size]
 */
export function icon(name, size = 20) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [k, v] of Object.entries({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' })) s.setAttribute(k, v);
  s.innerHTML = ICONS[name] || '';
  return s;
}

/** @param {Function} fn @param {number} [ms] */
export function debounce(fn, ms = 300) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

/** Инициалы для аватарки-заглушки. @param {string} name */
export function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || '').join('') || '?';
}

/** @param {string} s */
export const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s).trim());

/**
 * Разрешает редирект только на страницы этого же сайта (защита от open redirect).
 * @param {string|null} next
 * @returns {string|null}
 */
export function safeNext(next) {
  if (!next || !/^[\w\-./?=&%#]+$/.test(next) || next.startsWith('/') || next.includes('//') || next.includes('..')) return null;
  return next;
}

/** @param {number} amount @param {string} [currency] */
export function formatMoney(amount, currency = 'USD') {
  try {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch { return `${amount} ${currency}`; }
}
