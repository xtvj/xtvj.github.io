type Theme = 'system' | 'light' | 'dark';
type Width = 'normal' | 'wide';
type Preferences = { theme: Theme; width: Width; fontSize: number };

const defaults: Preferences = { theme: 'system', width: 'normal', fontSize: 17 };
const root = document.documentElement;
const button = document.querySelector<HTMLButtonElement>('#settings-button');
const panel = document.querySelector<HTMLDialogElement>('#settings-panel');
const slider = document.querySelector<HTMLInputElement>('#font-size-slider');
const output = document.querySelector<HTMLOutputElement>('#font-size-output');

let preferences = readPreferences();

function readPreferences(): Preferences {
  try {
    const saved = JSON.parse(localStorage.getItem('xtvj-display-settings') || '{}');
    return {
      theme: ['system', 'light', 'dark'].includes(saved.theme) ? saved.theme : defaults.theme,
      width: ['normal', 'wide'].includes(saved.width) ? saved.width : defaults.width,
      fontSize: Number.isFinite(Number(saved.fontSize)) && Number(saved.fontSize) >= 15 && Number(saved.fontSize) <= 23
        ? Number(saved.fontSize)
        : defaults.fontSize,
    };
  } catch {
    return { ...defaults };
  }
}

function applyPreferences() {
  root.dataset.theme = preferences.theme;
  root.dataset.width = preferences.width;
  root.style.fontSize = `${preferences.fontSize}px`;
  try {
    localStorage.setItem('xtvj-display-settings', JSON.stringify(preferences));
  } catch {}

  document.querySelectorAll<HTMLButtonElement>('[data-pref]').forEach((choice) => {
    const selected = preferences[choice.dataset.pref as 'theme' | 'width'] === choice.dataset.value;
    choice.setAttribute('aria-pressed', String(selected));
  });

  if (slider) slider.value = String(preferences.fontSize);
  if (output) output.value = `${preferences.fontSize} px`;
}

if (button && panel) {
  button.addEventListener('click', () => {
  if (panel.open) {
    panel.close();
  } else {
    panel.show();
    button.setAttribute('aria-expanded', 'true');
    panel.querySelector<HTMLButtonElement>('[data-pref]')?.focus();
  }
  });
}

if (panel) {
  panel.addEventListener('close', () => button?.setAttribute('aria-expanded', 'false'));
  panel.querySelector<HTMLButtonElement>('[data-close-settings]')?.addEventListener('click', () => panel.close());
}

document.addEventListener('click', (event) => {
  if (panel?.open && event.target instanceof Node && !panel.contains(event.target) && event.target !== button) {
    panel.close();
  }
});

document.querySelectorAll<HTMLButtonElement>('[data-pref]').forEach((choice) => {
  choice.addEventListener('click', () => {
    const key = choice.dataset.pref;
    const value = choice.dataset.value;
    if (key === 'theme' && ['system', 'light', 'dark'].includes(value ?? '')) {
      preferences.theme = value as Theme;
    }
    if (key === 'width' && ['normal', 'wide'].includes(value ?? '')) {
      preferences.width = value as Width;
    }
    applyPreferences();
  });
});

if (slider) {
  slider.addEventListener('input', () => {
    preferences.fontSize = Number(slider.value);
    applyPreferences();
  });
}

document.querySelector<HTMLButtonElement>('#font-smaller')?.addEventListener('click', () => {
  preferences.fontSize = Math.max(15, preferences.fontSize - 1);
  applyPreferences();
});

document.querySelector<HTMLButtonElement>('#font-larger')?.addEventListener('click', () => {
  preferences.fontSize = Math.min(23, preferences.fontSize + 1);
  applyPreferences();
});

applyPreferences();
