/**
 * Inline SVG icons (Lucide-style) — display only.
 */
const Icons = {
  attrs: 'xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"',

  svg(paths, size = 20) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  },

  plane(size) {
    return Icons.svg('<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 2 1 1-1v-3l2-2 3.4 5.9c.2.4.7.5 1.1.4l.5-.2c.4-.3.6-.7.5-1.2z"/>', size);
  },

  mapPin(size) {
    return Icons.svg('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>', size);
  },

  calendar(size) {
    return Icons.svg('<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>', size);
  },

  users(size) {
    return Icons.svg('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>', size);
  },

  mail(size) {
    return Icons.svg('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>', size);
  },

  lock(size) {
    return Icons.svg('<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>', size);
  },

  user(size) {
    return Icons.svg('<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>', size);
  },

  creditCard(size) {
    return Icons.svg('<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>', size);
  },

  search(size) {
    return Icons.svg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', size);
  },

  planeLarge() {
    return `<svg class="plane-svg" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 2 1 1-1v-3l2-2 3.4 5.9c.2.4.7.5 1.1.4l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>`;
  }
};

window.Icons = Icons;
