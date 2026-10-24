interface AdminComment {
  id: number;
  post_slug: string;
  nickname: string;
  body: string;
  created_at: string;
}

const page = document.querySelector<HTMLElement>('.admin-page');
const login = document.querySelector<HTMLFormElement>('#admin-login');
const passwordInput = document.querySelector<HTMLInputElement>('#admin-password');
const dashboard = document.querySelector<HTMLElement>('#admin-dashboard');
const comments = document.querySelector<HTMLElement>('#admin-comments');
const message = document.querySelector<HTMLElement>('#admin-message');
const more = document.querySelector<HTMLButtonElement>('#admin-more');
const logout = document.querySelector<HTMLButtonElement>('#admin-logout');
const passwordForm = document.querySelector<HTMLFormElement>('#admin-password-form');

if (page && login && passwordInput && dashboard && comments && message && more && logout && passwordForm) {
  const apiUrl = page.dataset.adminApi;
  const sessionKey = 'xtvj-admin-session';
  let session = '';
  let cursor: number | null = null;
  try { session = sessionStorage.getItem(sessionKey) || ''; } catch {}

  const saveSession = (value: string) => {
    session = value;
    try {
      if (value) sessionStorage.setItem(sessionKey, value);
      else sessionStorage.removeItem(sessionKey);
    } catch {}
  };

  const showLogin = () => {
    saveSession('');
    dashboard.hidden = true;
    login.hidden = false;
    comments.replaceChildren();
    cursor = null;
  };

  const request = async (url: URL, method = 'GET', body?: object) => {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${session}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
    if (response.status === 401) {
      showLogin();
      throw new Error('登录已失效，请重新输入密码。');
    }
    if (response.status === 429) throw new Error('请求太频繁，请稍后重试。');
    if (response.status === 400) throw new Error('当前密码不正确，或新密码不符合长度要求。');
    if (!response.ok) throw new Error('操作失败，请稍后重试。');
    return response.json();
  };

  const renderComment = (comment: AdminComment) => {
    const card = document.createElement('article');
    card.className = 'admin-comment';
    const meta = document.createElement('p');
    meta.className = 'admin-comment-meta';
    const author = document.createElement('strong');
    author.textContent = comment.nickname;
    const date = document.createElement('span');
    const parsedDate = new Date(comment.created_at);
    date.textContent = Number.isNaN(parsedDate.getTime()) ? '' : parsedDate.toLocaleString('zh-CN');
    meta.append(author, date);
    const articleLink = document.createElement('a');
    articleLink.href = `${import.meta.env.BASE_URL}posts/${encodeURIComponent(comment.post_slug)}/#comments`;
    articleLink.textContent = comment.post_slug;
    const content = document.createElement('p');
    content.className = 'admin-comment-body';
    content.textContent = comment.body;
    const actions = document.createElement('div');
    actions.className = 'admin-comment-actions';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'admin-delete';
    remove.textContent = '删除评论';
    remove.addEventListener('click', () => {
      if (window.confirm(`确定删除 #${comment.id} 的评论吗？`)) void deleteComment(comment.id, card);
    });
    actions.append(remove);
    card.append(meta, articleLink, content, actions);
    comments.append(card);
  };

  const deleteComment = async (id: number, card: HTMLElement) => {
    if (!apiUrl) return;
    try {
      await request(new URL(`${apiUrl}/${id}`), 'DELETE');
      card.remove();
      message.textContent = `评论 #${id} 已删除。`;
    } catch (error) {
      message.textContent = error instanceof Error ? error.message : '删除失败。';
    }
  };

  const load = async (reset = false) => {
    if (!apiUrl || !session) return false;
    if (reset) {
      comments.replaceChildren();
      cursor = null;
      more.hidden = true;
    }
    more.disabled = true;
    message.textContent = '正在读取评论…';
    const url = new URL(apiUrl);
    if (cursor !== null) url.searchParams.set('cursor', String(cursor));
    try {
      const data: { comments: AdminComment[]; nextCursor: number | null } = await request(url);
      for (const comment of data.comments) renderComment(comment);
      cursor = data.nextCursor;
      more.hidden = cursor === null;
      message.textContent = comments.childElementCount ? '' : '当前没有评论。';
      return true;
    } catch (error) {
      message.textContent = error instanceof Error ? error.message : '读取失败。';
      return false;
    } finally {
      more.disabled = false;
    }
  };

  login.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!apiUrl) return;
    const submit = login.querySelector<HTMLButtonElement>('[type="submit"]');
    if (submit) submit.disabled = true;
    message.textContent = '正在登录…';
    void fetch(new URL('./login', apiUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: passwordInput.value }),
      cache: 'no-store',
    }).then(async (response) => {
      if (response.status === 401) throw new Error('密码错误。');
      if (response.status === 429) throw new Error('尝试次数过多，请稍后重试。');
      if (!response.ok) throw new Error('登录失败，请确认已初始化管理密码。');
      const data: { session: string } = await response.json();
      saveSession(data.session);
      passwordInput.value = '';
      login.hidden = true;
      dashboard.hidden = false;
      await load(true);
    }).catch((error: Error) => {
      message.textContent = error.message;
    }).finally(() => {
      if (submit) submit.disabled = false;
    });
  });

  passwordForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!apiUrl) return;
    const current = passwordForm.querySelector<HTMLInputElement>('#admin-current-password');
    const next = passwordForm.querySelector<HTMLInputElement>('#admin-new-password');
    const confirm = passwordForm.querySelector<HTMLInputElement>('#admin-confirm-password');
    if (!current || !next || !confirm) return;
    if (next.value !== confirm.value) {
      message.textContent = '两次输入的新密码不一致。';
      return;
    }
    const submit = passwordForm.querySelector<HTMLButtonElement>('[type="submit"]');
    if (submit) submit.disabled = true;
    message.textContent = '正在修改密码…';
    void request(new URL('./password', apiUrl), 'POST', {
      currentPassword: current.value,
      newPassword: next.value,
    }).then((data: { session: string }) => {
      saveSession(data.session);
      passwordForm.reset();
      message.textContent = '密码已修改，其他登录会话已失效。';
    }).catch((error: Error) => {
      message.textContent = error.message;
    }).finally(() => {
      if (submit) submit.disabled = false;
    });
  });

  logout.addEventListener('click', () => {
    showLogin();
    passwordForm.reset();
    message.textContent = '已退出。';
  });
  more.addEventListener('click', () => void load());

  if (session && apiUrl) {
    login.hidden = true;
    dashboard.hidden = false;
    void load(true);
  }
}
