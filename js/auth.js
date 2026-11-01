/** Firebase Auth + профиль пользователя (users/{uid}). Единственное место, где создаётся приложение Firebase. */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup,
  GoogleAuthProvider, sendEmailVerification, sendPasswordResetEmail, signOut, updateProfile,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { firebaseConfig, isConfigured } from './firebase-config.js';
import { appStore, cache } from './store.js';
import { t, has } from './i18n.js';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
auth.languageCode = 'ru';

const PROFILE_TTL = 10 * 60 * 1000;
let pendingName = null;
let readyPromise = null;

/** Плоский снимок пользователя для store (Firebase User меняется «на месте», подписчики этого не увидят). */
const snap = (u) => u && ({ uid: u.uid, email: u.email, emailVerified: u.emailVerified, displayName: u.displayName, photoURL: u.photoURL });

const notify = (type, text) => window.dispatchEvent(new CustomEvent('spkz:notice', { detail: { type, text } }));

function assertConfigured() {
  if (!isConfigured) throw Object.assign(new Error('not configured'), { code: 'app/not-configured' });
}

/**
 * Понятное сообщение об ошибке Firebase Auth.
 * @param {{code?: string}} err
 * @returns {string}
 */
export function authErrorMessage(err) {
  if (err?.code === 'app/not-configured') return t('err.not-configured');
  const key = `err.auth.${String(err?.code || '').replace('auth/', '')}`;
  return has(key) ? t(key) : t('err.generic');
}

/**
 * Читает users/{uid}; при первом входе создаёт документ с ролью student (поля role/banned/plan дальше клиент менять не сможет).
 * Результат кэшируется на 10 минут, чтобы не тратить чтения Firestore на каждой странице.
 */
async function loadProfile(user) {
  const key = `profile:${user.uid}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const ref = doc(db, 'users', user.uid);
  const s = await getDoc(ref);
  let profile;
  if (s.exists()) {
    profile = { id: user.uid, ...s.data() };
    delete profile.createdAt;
  } else {
    const data = {
      role: 'student',
      displayName: user.displayName || pendingName || String(user.email || '').split('@')[0],
      email: user.email || '',
      favorites: [],
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, data);
    profile = { id: user.uid, ...data };
    delete profile.createdAt;
  }
  cache.set(key, profile, PROFILE_TTL);
  return profile;
}

/** Запускает отслеживание входа. Промис выполняется после первого определения состояния. */
export function initAuth() {
  if (readyPromise) return readyPromise;
  readyPromise = new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        appStore.set({ user: null, profile: null, ready: true });
        return resolve(null);
      }
      let profile = null;
      try { profile = await loadProfile(user); } catch (e) { console.warn('profile load failed', e); }
      if (profile?.banned) {
        await signOut(auth);
        notify('error', t('auth.banned'));
        return resolve(null);
      }
      appStore.set({ user: snap(user), profile, ready: true });
      resolve(user);
    });
  });
  return readyPromise;
}

/** @param {{email: string, password: string, name: string}} p */
export async function signUp({ email, password, name }) {
  assertConfigured();
  pendingName = name;
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await sendEmailVerification(cred.user);
  appStore.set({ user: snap(cred.user) });
  return cred.user;
}

/** @param {string} email @param {string} password */
export async function signIn(email, password) {
  assertConfigured();
  return (await signInWithEmailAndPassword(auth, email, password)).user;
}

export async function signInWithGoogle() {
  assertConfigured();
  return (await signInWithPopup(auth, new GoogleAuthProvider())).user;
}

/** @param {string} email */
export async function resetPassword(email) {
  assertConfigured();
  await sendPasswordResetEmail(auth, email);
}

export async function resendVerification() {
  if (!auth.currentUser) return;
  await sendEmailVerification(auth.currentUser);
}

/** Перечитывает пользователя после подтверждения email и обновляет токен (Worker смотрит на email_verified в токене). */
export async function refreshUser() {
  const u = auth.currentUser;
  if (!u) return false;
  await u.reload();
  await u.getIdToken(true);
  appStore.set({ user: snap(u) });
  return u.emailVerified;
}

export async function logout() {
  const u = auth.currentUser;
  if (u) cache.del(`profile:${u.uid}`);
  await signOut(auth);
}

/** ID-токен для запросов к Worker. @param {boolean} [force] */
export async function getToken(force = false) {
  return auth.currentUser ? auth.currentUser.getIdToken(force) : null;
}

/** Перенаправляет гостя на страницу входа с возвратом на текущую страницу. */
export async function requireAuth() {
  await initAuth();
  if (appStore.get().user) return true;
  const here = location.pathname.split('/').pop() || 'index.html';
  location.replace(`login.html?next=${encodeURIComponent(here + location.search)}`);
  return false;
}
