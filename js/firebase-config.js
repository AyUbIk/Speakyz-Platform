/**
 * Публичная конфигурация клиента. Это не секреты: защита данных — в правилах Firestore и в Worker.
 * Заполните значениями из Firebase Console → Project settings → Your apps → Web app.
 */
export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT',
  appId: 'YOUR_APP_ID',
};

/** Адрес Cloudflare Worker (без слэша на конце). */
export const WORKER_URL = 'https://speakyz-api.YOUR_SUBDOMAIN.workers.dev';

/** Публичный ключ Cloudflare Turnstile. */
export const TURNSTILE_SITEKEY = 'YOUR_TURNSTILE_SITE_KEY';

/** Публичный адрес сайта (для canonical, sitemap, Open Graph). */
export const SITE_URL = 'https://YOUR_USER.github.io/speakyz';

/** false, пока в firebaseConfig остались значения-заглушки. */
export const isConfigured = !firebaseConfig.apiKey.startsWith('YOUR_') && !firebaseConfig.projectId.startsWith('YOUR_');
