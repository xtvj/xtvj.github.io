const copyIcon = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>';

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    // Support browsers where the Clipboard API is unavailable or denied.
    const field = document.createElement('textarea');
    field.value = text;
    field.className = 'copy-code-fallback';
    field.setAttribute('readonly', '');
    const focused = document.activeElement;
    const selection = window.getSelection();
    const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index).cloneRange()) : [];
    document.body.append(field);
    try {
      field.select();
      if (!document.execCommand('copy')) throw new Error('Copy failed');
    } finally {
      field.remove();
      if (focused instanceof HTMLElement) focused.focus({ preventScroll: true });
      selection?.removeAllRanges();
      for (const range of ranges) selection?.addRange(range);
    }
  }
}

const body = document.querySelector<HTMLElement>('.article-body');
if (body) {
  const status = document.createElement('span');
  status.className = 'sr-only';
  status.setAttribute('role', 'status');
  body.append(status);

  for (const code of body.querySelectorAll<HTMLElement>('code')) {
    const pre = code.closest('pre');
    const wrapper = document.createElement(pre ? 'div' : 'span');
    wrapper.className = pre ? 'code-block-copy' : 'inline-code-copy';
    const target = pre ?? code;
    target.before(wrapper);
    wrapper.append(target);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-code-button';
    button.innerHTML = copyIcon;
    const label = document.createElement('span');
    label.textContent = '复制代码';
    if (!pre) label.className = 'sr-only';
    button.append(label);
    button.setAttribute('aria-label', '复制代码');
    button.title = '复制代码';
    if (pre) wrapper.prepend(button);
    else wrapper.append(button);

    let resetTimer: ReturnType<typeof setTimeout>;
    button.addEventListener('click', async () => {
      clearTimeout(resetTimer);
      status.textContent = '';
      button.disabled = true;
      try {
        await copyText(code.textContent ?? '');
        label.textContent = '已复制';
        button.dataset.state = 'success';
        status.textContent = '代码已复制到剪贴板';
      } catch {
        label.textContent = '复制失败';
        button.dataset.state = 'error';
        status.textContent = '复制失败，请手动选中代码复制';
      } finally {
        button.disabled = false;
        button.title = label.textContent;
        button.setAttribute('aria-label', label.textContent);
        resetTimer = setTimeout(() => {
          label.textContent = '复制代码';
          button.title = '复制代码';
          button.setAttribute('aria-label', '复制代码');
          delete button.dataset.state;
        }, 2000);
      }
    });
  }
}
