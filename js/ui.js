/** Общий интерфейс: тема, шапка, подвал, тосты, баннеры, диалог подтверждения. */
import { el, icon, initials } from './utils.js';
import { t, applyI18n } from './i18n.js';
import { appStore } from './store.js';
import { logout, resendVerification, refreshUser, authErrorMessage } from './auth.js';

/* ---------- Тема ---------- */

const THEME_KEY = 'spkz:theme';
const currentTheme = () => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0E1122' : '#F5F6FB');
}

/** Следит за системной темой, пока пользователь не выбрал свою. */
export function initTheme() {
  applyTheme(currentTheme());
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    try { if (localStorage.getItem(THEME_KEY)) return; } catch { /* storage недоступен */ }
    applyTheme(e.matches ? 'dark' : 'light');
  });
}

function toggleTheme(btn) {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem(THEME_KEY, next); } catch { /* storage недоступен */ }
  btn.replaceChildren(icon(next === 'dark' ? 'sun' : 'moon'));
}

/* ---------- Мелкие помощники ---------- */

/** Блокирует кнопку на время запроса. @param {HTMLButtonElement} btn @param {boolean} on */
export function setBusy(btn, on) {
  btn.disabled = on;
  btn.setAttribute('aria-busy', String(on));
}

/** Заготовка для списков во время загрузки. @param {number} n */
export function skeletonCards(n = 6) {
  return Array.from({ length: n }, () => el('div', { class: 'skeleton h-56 w-full', 'aria-hidden': 'true' }));
}

let toastBox;
/**
 * Всплывающее уведомление.
 * @param {string} text
 * @param {'info'|'ok'|'error'} [type]
 * @param {number} [ms]
 */
export function toast(text, type = 'info', ms = 5000) {
  if (!toastBox) {
    toastBox = el('div', { class: 'toasts', 'aria-live': 'polite' });
    document.body.append(toastBox);
  }
  const node = el('div', { class: `toast toast-${type}`, role: type === 'error' ? 'alert' : 'status' }, text);
  toastBox.append(node);
  setTimeout(() => node.remove(), ms);
}

/**
 * Постоянная полоса сообщения под шапкой (проблемы с квотой, настройкой, офлайн).
 * @param {string} text @param {'warn'|'error'|'info'} [type] @param {string} [id] повторный вызов с тем же id не дублирует
 */
export function showBanner(text, type = 'warn', id = text) {
  const box = document.getElementById('site-banners');
  if (!box || box.querySelector(`[data-id="${CSS.escape(id)}"]`)) return;
  box.append(el('div', { class: `banner banner-${type}`, role: 'status', dataset: { id } }, text));
}

/** @param {string} id */
export function hideBanner(id) { document.querySelector(`#site-banners [data-id="${CSS.escape(id)}"]`)?.remove(); }

/**
 * Диалог подтверждения.
 * @param {string} message
 * @param {{confirmText?: string, danger?: boolean}} [opts]
 * @returns {Promise<boolean>}
 */
export function confirmDialog(message, { confirmText = t('common.confirm'), danger = false } = {}) {
  return new Promise((resolve) => {
    const dlg = el('dialog', { class: 'dialog bubble' },
      el('p', { class: 'mb-5' }, message),
      el('div', { class: 'flex justify-end gap-2' },
        el('button', { class: 'btn btn-ghost', type: 'button', onclick: () => dlg.close('no') }, t('common.cancel')),
        el('button', { class: `btn ${danger ? 'btn-danger' : 'btn-primary'}`, type: 'button', onclick: () => dlg.close('yes') }, confirmText)));
    dlg.addEventListener('close', () => { resolve(dlg.returnValue === 'yes'); dlg.remove(); });
    document.body.append(dlg);
    dlg.showModal();
  });
}

/* ---------- Логотип ---------- */

function logo() {
  const mark = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  mark.setAttribute('viewBox', '0 0 32 32');
  mark.setAttribute('width', '30');
  mark.setAttribute('height', '30');
  mark.setAttribute('aria-hidden', 'true');
  // статичная доверенная разметка логотипа
  mark.innerHTML = '<path fill="rgb(var(--c-brand))" d="M6 4h20a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H14l-7 5v-5H6a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z"/><path d="M10 11h12l-12 8h12" fill="none" stroke="rgb(var(--c-on-brand))" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>';
  return el('a', { href: 'index.html', class: 'flex items-center gap-2 font-display text-lg font-semibold tracking-tight', 'aria-label': 'Speakyz' }, mark, 'Speakyz');
}

/* ---------- Шапка ---------- */

const NAV = [['nav.catalog', 'index.html'], ['nav.tutors', 'profile.html']];

function isHere(href) {
  const p = location.pathname;
  return p.endsWith('/' + href) || (href === 'index.html' && p.endsWith('/'));
}

const navLink = (key, href, cls) => el('a', { href, class: `${cls}${isHere(href) ? ' is-active' : ''}`, 'aria-current': isHere(href) ? 'page' : null }, t(key));

function nextQuery() {
  const here = location.pathname.split('/').pop();
  return !here || here === 'index.html' || here === 'login.html' ? '' : `?next=${encodeURIComponent(here + location.search)}`;
}

function renderAuthArea(box, { user, profile, ready }) {
  box.replaceChildren();
  if (!ready) { box.append(el('span', { class: 'skeleton h-10 w-24 !rounded-full', 'aria-hidden': 'true' })); return; }
  if (!user) { box.append(el('a', { href: `login.html${nextQuery()}`, class: 'btn btn-primary' }, t('auth.login'))); return; }

  const name = profile?.displayName || user.displayName || user.email || '';
  const menu = el('div', { class: 'menu', role: 'menu', hidden: true },
    el('div', { class: 'px-3 py-2 text-sm text-muted truncate' }, user.email),
    el('a', { role: 'menuitem', href: 'dashboard.html' }, t('auth.cabinet')),
    el('a', { role: 'menuitem', href: 'profile.html' }, t('auth.profile')),
    profile?.role === 'admin' && el('a', { role: 'menuitem', href: 'admin.html' }, t('auth.admin')),
    el('button', { role: 'menuitem', type: 'button', onclick: () => logout() }, t('auth.logout')));
  const btn = el('button', { class: 'avatar-btn', type: 'button', 'aria-haspopup': 'menu', 'aria-expanded': 'false', 'aria-label': t('auth.account') },
    user.photoURL ? el('img', { class: 'avatar', src: user.photoURL, alt: '', referrerpolicy: 'no-referrer' }) : el('span', { class: 'avatar' }, initials(name)),
    el('span', { class: 'hidden max-w-[9rem] truncate sm:inline' }, name),
    icon('chevron', 16));
  btn.addEventListener('click', () => {
    menu.hidden = !menu.hidden;
    btn.setAttribute('aria-expanded', String(!menu.hidden));
  });
  box.append(el('div', { class: 'relative', dataset: { menuRoot: '' } }, btn, menu));
}

function renderVerifyBar(box, { user }) {
  box.replaceChildren();
  if (!user || user.emailVerified) return;
  const resend = el('button', { class: 'link', type: 'button' }, t('auth.verify.resend'));
  const check = el('button', { class: 'link', type: 'button' }, t('auth.verify.check'));
  resend.addEventListener('click', async () => {
    setBusy(resend, true);
    try { await resendVerification(); toast(t('auth.verify.sent', { email: user.email }), 'ok'); } catch (e) { toast(authErrorMessage(e), 'error'); }
    setBusy(resend, false);
  });
  check.addEventListener('click', async () => {
    setBusy(check, true);
    try { toast(await refreshUser() ? t('auth.verify.ok') : t('auth.verify.still'), 'info'); } catch (e) { toast(authErrorMessage(e), 'error'); }
    setBusy(check, false);
  });
  box.append(el('div', { class: 'banner banner-info flex flex-wrap items-center justify-center gap-x-4 gap-y-1' }, t('auth.verify.text'), resend, check));
}

/** Рисует шапку в #site-header и подписывается на состояние входа. */
export function renderHeader() {
  const host = document.getElementById('site-header');
  if (!host) return;

  const themeBtn = el('button', { class: 'icon-btn', type: 'button', 'aria-label': t('theme.toggle') }, icon(currentTheme() === 'dark' ? 'sun' : 'moon'));
  themeBtn.addEventListener('click', () => toggleTheme(themeBtn));

  const authBox = el('div', { class: 'flex items-center' });
  const mobilePanel = el('nav', { id: 'mobile-nav', class: 'mobile-nav md:hidden', hidden: true, 'aria-label': t('nav.menu') }, NAV.map(([k, h]) => navLink(k, h, 'mobile-link')));
  const burger = el('button', { class: 'icon-btn md:hidden', type: 'button', 'aria-label': t('nav.menu'), 'aria-expanded': 'false', 'aria-controls': 'mobile-nav' }, icon('menu'));
  burger.addEventListener('click', () => {
    mobilePanel.hidden = !mobilePanel.hidden;
    burger.setAttribute('aria-expanded', String(!mobilePanel.hidden));
    burger.replaceChildren(icon(mobilePanel.hidden ? 'menu' : 'close'));
  });

  const verifyBox = el('div');
  host.replaceChildren(
    el('header', { class: 'sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur' },
      el('div', { class: 'mx-auto flex h-16 max-w-6xl items-center gap-2 px-4' },
        logo(),
        el('nav', { class: 'ml-6 hidden items-center gap-1 md:flex', 'aria-label': t('nav.menu') }, NAV.map(([k, h]) => navLink(k, h, 'nav-link'))),
        el('div', { class: 'ml-auto flex items-center gap-1' }, themeBtn, authBox, burger)),
      mobilePanel),
    verifyBox,
    el('div', { id: 'site-banners' }));

  const render = (s) => { renderAuthArea(authBox, s); renderVerifyBar(verifyBox, s); };
  render(appStore.get());
  appStore.subscribe(render);

  document.addEventListener('click', (e) => {
    document.querySelectorAll('[data-menu-root]').forEach((root) => {
      if (root.contains(e.target)) return;
      root.querySelector('.menu')?.setAttribute('hidden', '');
      root.querySelector('button')?.setAttribute('aria-expanded', 'false');
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('[data-menu-root] .menu').forEach((m) => m.setAttribute('hidden', ''));
  });
  window.addEventListener('spkz:notice', (e) => toast(e.detail.text, e.detail.type));
}

/* ---------- Подвал ---------- */

/** Рисует подвал в #site-footer. */
export function renderFooter() {
  const host = document.getElementById('site-footer');
  if (!host) return;
  host.replaceChildren(
    el('footer', { class: 'mt-16 border-t border-line bg-surface' },
      el('div', { class: 'mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-[1.4fr_1fr]' },
        el('div', { class: 'space-y-3' },
          el('p', { class: 'font-display text-lg font-semibold' }, 'Speakyz'),
          el('p', { class: 'max-w-prose text-sm text-muted' }, t('footer.about')),
          el('p', { class: 'max-w-prose text-sm text-muted' }, t('footer.disclaimer'))),
        el('nav', { class: 'flex flex-col gap-2 text-sm md:items-end' },
          el('a', { class: 'link', href: 'legal.html#terms' }, t('footer.terms')),
          el('a', { class: 'link', href: 'legal.html#privacy' }, t('footer.privacy')),
          el('span', { class: 'text-muted' }, t('footer.rights', { year: new Date().getFullYear() }))))));
}

export { applyI18n };
