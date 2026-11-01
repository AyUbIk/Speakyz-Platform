// Выполняется синхронно в <head>, чтобы тема применилась до первой отрисовки (без вспышки).
(function () {
  try {
    var t = localStorage.getItem('spkz:theme');
    if (t !== 'light' && t !== 'dark') t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.dataset.theme = t;
  } catch (e) { document.documentElement.dataset.theme = 'light'; }
})();
