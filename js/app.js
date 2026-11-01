/**
 * Точка входа каждой страницы: <script type="module" src="js/app.js">.
 * Управляется атрибутами <body>: data-auth="required" — только для вошедших, data-module="catalog.js" — модуль страницы.
 */
import { initTheme, renderHeader, renderFooter, showBanner, hideBanner } from './ui.js';
import { initAuth, requireAuth } from './auth.js';
import { applyI18n, t } from './i18n.js';
import { isConfigured } from './firebase-config.js';

async function main() {
  initTheme();
  applyI18n();
  renderHeader();
  renderFooter();

  if (!isConfigured) showBanner(t('err.not-configured'), 'warn', 'not-configured');
  const syncOnline = () => (navigator.onLine ? hideBanner('offline') : showBanner(t('err.offline'), 'warn', 'offline'));
  addEventListener('online', syncOnline);
  addEventListener('offline', syncOnline);
  syncOnline();

  await initAuth();
  if (document.body.dataset.auth === 'required' && !(await requireAuth())) return;

  const mod = document.body.dataset.module;
  if (mod && /^[a-z0-9-]+\.js$/.test(mod)) await import(`./${mod}`);
}

main().catch((e) => {
  console.error(e);
  showBanner(t('err.generic'), 'error', 'boot');
});
