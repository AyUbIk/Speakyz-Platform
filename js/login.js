/** Страница входа и регистрации. */
import { signIn, signUp, signInWithGoogle, resetPassword, authErrorMessage } from './auth.js';
import { appStore } from './store.js';
import { t } from './i18n.js';
import { $, isEmail, safeNext } from './utils.js';
import { setBusy, toast } from './ui.js';

const next = safeNext(new URLSearchParams(location.search).get('next')) || 'index.html';
if (appStore.get().user) location.replace(next);

const form = $('#auth-form');
const errorBox = $('#form-error');
const submitBtn = $('#submit-btn');
let mode = location.hash === '#register' ? 'register' : 'login';

function render() {
  const reg = mode === 'register';
  $('#login-title').textContent = t(reg ? 'auth.register' : 'auth.login');
  submitBtn.textContent = t(reg ? 'auth.submit.register' : 'auth.submit.login');
  $('#name-row').hidden = !reg;
  $('#consent-row').hidden = !reg;
  $('#forgot-btn').hidden = reg;
  $('#password-hint').hidden = !reg;
  $('#password').autocomplete = reg ? 'new-password' : 'current-password';
  document.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === mode)));
  errorBox.textContent = '';
}

const fail = (msg) => { errorBox.textContent = msg; };

document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { mode = b.dataset.tab; render(); }));

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  fail('');
  if (form.elements.website.value) return; // honeypot: человек это поле не видит

  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;
  const name = form.elements.name.value.trim();

  if (!isEmail(email)) return fail(t('err.email'));
  if (mode === 'register') {
    if (name.length < 2) return fail(t('err.name-short'));
    if (password.length < 8) return fail(t('err.password-short'));
    if (!form.elements.consent.checked) return fail(t('err.consent'));
  } else if (!password) return fail(t('err.required'));

  setBusy(submitBtn, true);
  try {
    if (mode === 'register') { await signUp({ email, password, name }); toast(t('auth.registered'), 'ok'); } else await signIn(email, password);
    location.replace(next);
  } catch (err) {
    fail(authErrorMessage(err));
    setBusy(submitBtn, false);
  }
});

$('#google-btn').addEventListener('click', async (e) => {
  fail('');
  setBusy(e.currentTarget, true);
  try { await signInWithGoogle(); location.replace(next); } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') fail(authErrorMessage(err));
    setBusy(e.currentTarget, false);
  }
});

$('#forgot-btn').addEventListener('click', async () => {
  const email = form.elements.email.value.trim();
  if (!isEmail(email)) return fail(t('auth.reset.need_email'));
  try { await resetPassword(email); toast(t('auth.reset.sent', { email }), 'ok'); } catch (err) { fail(authErrorMessage(err)); }
});

render();
