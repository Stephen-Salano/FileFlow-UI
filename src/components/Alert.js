// src/components/Alert.js

/**
 * showAlert
 *  - Renders a DaisyUI-styled alert/toast with optional actions or detailed layout.
 *  - Supports four color variants and two structural variants: actions and detailed.
 *  - Auto-dismisses after `duration` ms or can be closed manually.
 *
 * Usage Examples:
 *
 * // Simple info toast
 * showAlert({ type: 'info', message: 'Saved successfully!' });
 *
 * // Alert with action buttons
 * showAlert({
 *   type: 'warning',
 *   message: 'We use cookies for no reason.',
 *   actions: [
 *     { label: 'Deny', onClick: () => console.log('Denied') },
 *     { label: 'Accept', primary: true, onClick: () => console.log('Accepted') }
 *   ]
 * });
 *
 * // Detailed alert with title and description
 * showAlert({
 *   type: 'info',
 *   title: 'New message!',
 *   description: 'You have 1 unread message',
 *   actionLabel: 'See',
 *   onAction: () => navigateTo('/messages')
 * });
 */
export function showAlert({
  type = 'info',           // 'info' | 'success' | 'warning' | 'error'
  title = '',              // Optional bold heading
  message = '',            // Main message text (for simple/action alerts)
  description = '',        // Smaller description (for detailed alerts)
  actions = [],            // Array of { label, onClick, primary }
  actionLabel = '',        // Single action button label (for detailed alerts)
  onAction = null,         // Single action callback
  duration = 4000,         // ms before auto-dismiss
} = {}) {
  // 1) VARIANT CONFIG: SVG icon + container class for each type
  const VARIANTS = {
    info: {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                     d="M13 16h-1v-4h-1m1-4h.01
                        M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>`,
      containerClass: 'alert-info'
    },
    success: {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                     d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>`,
      containerClass: 'alert-success'
    },
    warning: {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                     d="M12 9v2m0 4h.01
                        m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4
                        c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>`,
      containerClass: 'alert-warning'
    },
    error: {
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                     d="M10 14l2-2m0 0l2-2
                        m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>`,
      containerClass: 'alert-error'
    }
  };

  // Fallback to info if invalid type
  const { icon, containerClass } = VARIANTS[type] || VARIANTS.info;

  // 2) TOAST TRAY: fixed container for stacking
  let tray = document.getElementById('alert-container');
  if (!tray) {
    tray = document.createElement('div');
    tray.id = 'alert-container';
    tray.className = [
      'fixed top-4 left-1/2 transform -translate-x-1/2',
      'z-50 flex flex-col items-center space-y-2'
    ].join(' ');
    document.body.appendChild(tray);
  }

  // 3) ALERT ELEMENT
  const alertEl = document.createElement('div');
  alertEl.setAttribute('role', 'alert');
  alertEl.className = [
    'alert',                // base class
    containerClass,         // variant class
    'shadow-lg',            // elevation
    actions.length || actionLabel ? 'alert-vertical sm:alert-horizontal' : 'flex items-center',
    'opacity-0',            // start hidden for fade-in
    'transition-opacity duration-200'
  ].join(' ');

  // 4) INNER MARKUP
  if (actions.length) {
    // ALERT WITH BUTTONS
    const buttonsHTML = actions.map(({ label, primary }) =>
      `<button class="btn btn-sm${primary ? ' btn-primary' : ''}" data-label="${label}">${label}</button>`
    ).join('');
    alertEl.innerHTML = `
      ${icon}
      <span class="flex-1">${message}</span>
      <div class="flex gap-2">${buttonsHTML}</div>
    `;
  } else if (title && description) {
    // DETAILED ALERT WITH TITLE & DESCRIPTION
    const actionBtn = actionLabel
      ? `<button class="btn btn-sm" data-action>${actionLabel}</button>`
      : '';
    alertEl.innerHTML = `
      ${icon}
      <div>
        <h3 class="font-bold">${title}</h3>
        <div class="text-xs">${description}</div>
      </div>
      ${actionBtn}
    `;
  } else {
    // SIMPLE ALERT
    alertEl.innerHTML = `
      ${icon}
      <div class="flex-1">
        ${title ? `<h3 class="font-bold">${title}</h3>` : ''}
        <p>${message}</p>
      </div>
    `;
  }

  // 5) APPEND & FADE IN
  tray.appendChild(alertEl);
  requestAnimationFrame(() => alertEl.classList.remove('opacity-0'));

  // 6) EVENT BINDINGS
  // Manual close on any btn-ghost inside
  alertEl.querySelectorAll('button.btn-ghost, button[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-action') && typeof onAction === 'function') {
        onAction();
      }
      alertEl.remove();
    });
  });

  // custom onClick for action buttons
  if (actions.length) {
    actions.forEach(({ label, onClick }) => {
      const btn = alertEl.querySelector(`button[data-label="${label}"]`);
      if (btn && typeof onClick === 'function') btn.addEventListener('click', onClick);
    });
  }

  // 7) AUTO-DISMISS
  setTimeout(() => {
    alertEl.classList.add('opacity-0');
    alertEl.addEventListener('transitionend', () => alertEl.remove(), { once: true });
  }, duration);
}
