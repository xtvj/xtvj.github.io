interface Profile { nickname: string; avatar_id: string }
const page = document.querySelector<HTMLElement>('.admin-settings-page');
const content = document.querySelector<HTMLElement>('#admin-settings-content');
const message = document.querySelector<HTMLElement>('#admin-settings-message');
const profileForm = document.querySelector<HTMLFormElement>('#admin-profile-form');
const passwordForm = document.querySelector<HTMLFormElement>('#admin-password-form');

if (page && content && message && profileForm && passwordForm) {
  const apiUrl = page.dataset.profileApi;
  const sessionKey = 'xtvj-admin-session';
  let session = '';
  try { session = sessionStorage.getItem(sessionKey) || ''; } catch {}
  const showLogin = () => {
    content.hidden = true;
    message.replaceChildren('请先在', Object.assign(document.createElement('a'), { href: `${import.meta.env.BASE_URL}admin/`, textContent: '评论管理页面' }), '登录。');
  };
  const request = async (url: string, method = 'GET', body?: object) => {
    const response = await fetch(url, { method, headers: { Authorization: `Bearer ${session}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
    if (response.status === 401) {
      try { sessionStorage.removeItem(sessionKey); } catch {}
      session = '';
      showLogin();
      throw new Error('登录已失效。');
    }
    if (response.status === 429) throw new Error('请求太频繁，请稍后重试。');
    if (response.status === 400) throw new Error('资料无效或当前密码错误。');
    if (!response.ok) throw new Error('操作失败，请稍后重试。');
    return response.json();
  };
  if (!apiUrl || !session) showLogin();
  else void request(apiUrl).then(({ profile }: { profile: Profile }) => {
    const nickname = profileForm.querySelector<HTMLInputElement>('#admin-nickname');
    const avatar = profileForm.querySelector<HTMLInputElement>(`[name="avatar"][value="${profile.avatar_id}"]`);
    if (nickname) nickname.value = profile.nickname;
    if (avatar) avatar.checked = true;
    content.hidden = false;
    message.textContent = '';
  }).catch((error: Error) => { if (session) message.textContent = error.message; });

  profileForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!apiUrl) return;
    const nickname = profileForm.querySelector<HTMLInputElement>('#admin-nickname')?.value.trim();
    const avatarId = profileForm.querySelector<HTMLInputElement>('[name="avatar"]:checked')?.value;
    if (!nickname || !avatarId) return;
    const button = profileForm.querySelector<HTMLButtonElement>('[type="submit"]');
    if (button) button.disabled = true;
    void request(apiUrl, 'PUT', { nickname, avatarId }).then(() => { message.textContent = '资料已保存。'; }).catch((error: Error) => { message.textContent = error.message; }).finally(() => { if (button) button.disabled = false; });
  });
  passwordForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!apiUrl) return;
    const current = passwordForm.querySelector<HTMLInputElement>('#admin-current-password')?.value;
    const next = passwordForm.querySelector<HTMLInputElement>('#admin-new-password')?.value;
    const confirm = passwordForm.querySelector<HTMLInputElement>('#admin-confirm-password')?.value;
    if (next !== confirm) { message.textContent = '两次输入的新密码不一致。'; return; }
    const button = passwordForm.querySelector<HTMLButtonElement>('[type="submit"]');
    if (button) button.disabled = true;
    void request(new URL('./password', apiUrl).toString(), 'POST', { currentPassword: current, newPassword: next }).then(({ session: nextSession }: { session: string }) => {
      session = nextSession;
      try { sessionStorage.setItem(sessionKey, session); } catch {}
      passwordForm.reset();
      message.textContent = '密码已修改，其他登录会话已失效。';
    }).catch((error: Error) => { message.textContent = error.message; }).finally(() => { if (button) button.disabled = false; });
  });
}
