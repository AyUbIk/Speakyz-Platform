// Конфигурация Tailwind CDN. Цвета берутся из CSS-переменных (css/styles.css), поэтому тёмная тема не требует dark:-вариантов.
tailwind.config = {
  theme: {
    extend: {
      colors: Object.fromEntries(
        ['bg', 'surface', 'ink', 'muted', 'line', 'brand', 'on-brand', 'accent', 'danger', 'ok']
          .map((n) => [n, `rgb(var(--c-${n}) / <alpha-value>)`])
      ),
      fontFamily: {
        display: ['Unbounded', 'Onest', 'system-ui', 'sans-serif'],
        sans: ['Onest', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
};
