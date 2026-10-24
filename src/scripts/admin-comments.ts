interface AdminComment {
  id: number;
  post_slug: string;
  parent_id: number | null;
  nickname: string;
  body: string;
  created_at: string;
  avatar_id: string;
  is_admin: number;
}
import { avatarPath } from '../lib/comment-avatars.js';

const page = document.querySelector<HTMLElement>('.admin-page');
const login = document.querySelector<HTMLFormElement>('#admin-login');
const passwordInput = document.querySelector<HTMLInputElement>('#admin-password');
const dashboard = document.querySelector<HTMLElement>('#admin-dashboard');
const comments = document.querySelector<HTMLElement>('#admin-comments');
const message = document.querySelector<HTMLElement>('#admin-message');
const more = document.querySelector<HTMLButtonElement>('#admin-more');
const logout = document.querySelector<HTMLButtonElement>('#admin-logout');
const postSelect = document.querySelector<HTMLSelectElement>('#admin-post-select');
const postItems = [...document.querySelectorAll<HTMLButtonElement>('.admin-post-item')];
const settingsLink = document.querySelector<HTMLElement>('#admin-settings-link');
const count = document.querySelector<HTMLElement>('#admin-comment-count');

if (page && login && passwordInput && dashboard && comments && message && more && logout && postSelect) {
  const apiUrl = page.dataset.adminApi;
  const sessionKey = 'xtvj-admin-session';
  let session = '';
  let cursor: number | null = null;
  let requestSerial = 0;
  postSelect.selectedIndex = 0;
  const syncPostItems = () => {
    for (const item of postItems) item.setAttribute('aria-pressed', String(item.dataset.postSlug === postSelect.value));
  };
  syncPostItems();
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
    if (settingsLink) settingsLink.hidden = true;
    comments.replaceChildren();
    cursor = null;
    requestSerial++;
    if (count) count.textContent = '';
    postSelect.selectedIndex = 0;
    syncPostItems();
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
    if (response.status === 400) throw new Error('请求内容无效。');
    if (!response.ok) throw new Error('操作失败，请稍后重试。');
    return response.json();
  };

  const renderComment = (comment: AdminComment) => {
    const card = document.createElement('article');
    card.className = 'admin-comment';
    const meta = document.createElement('div');
    meta.className = 'admin-comment-meta';
    const avatar = document.createElement('img');
    avatar.className = 'comment-avatar';
    avatar.src = avatarPath(comment.avatar_id, import.meta.env.BASE_URL);
    avatar.alt = '';
    avatar.width = 36;
    avatar.height = 36;
    const author = document.createElement('strong');
    author.textContent = comment.nickname;
    const authorDetails = document.createElement('div');
    authorDetails.className = 'admin-comment-author';
    authorDetails.append(author);
    if (comment.is_admin) {
      const badge = document.createElement('span');
      badge.className = 'comment-admin-badge';
      badge.textContent = '管理员';
      authorDetails.append(badge);
    }
    if (comment.parent_id) {
      const reply = document.createElement('span');
      reply.className = 'admin-reply-label';
      reply.textContent = `回复 #${comment.parent_id}`;
      authorDetails.append(reply);
    }
    const date = document.createElement('span');
    const parsedDate = new Date(comment.created_at);
    date.textContent = Number.isNaN(parsedDate.getTime()) ? '' : parsedDate.toLocaleString('zh-CN');
    meta.append(avatar, authorDetails, date);
    const articleLink = document.createElement('a');
    articleLink.href = `${import.meta.env.BASE_URL}posts/${encodeURIComponent(comment.post_slug)}/#comments`;
    articleLink.textContent = '查看文章 ↗';
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
    actions.append(articleLink, remove);
    card.append(meta, content, actions);
    comments.append(card);
  };

  const deleteComment = async (id: number, card: HTMLElement) => {
    if (!apiUrl) return;
    try {
      await request(new URL(`${apiUrl}/${id}`), 'DELETE');
      card.remove();
      if (count) count.textContent = `已加载 ${comments.childElementCount} 条`;
      message.textContent = `评论 #${id} 已删除。`;
    } catch (error) {
      message.textContent = error instanceof Error ? error.message : '删除失败。';
    }
  };

  const load = async (reset = false) => {
    if (!apiUrl || !session || !postSelect.value) return false;
    if (reset) {
      comments.replaceChildren();
      cursor = null;
      more.hidden = true;
    }
    more.disabled = true;
    message.textContent = '正在读取评论…';
    const url = new URL(apiUrl);
    const selectedSlug = postSelect.value;
    const serial = ++requestSerial;
    url.searchParams.set('slug', selectedSlug);
    if (cursor !== null) url.searchParams.set('cursor', String(cursor));
    try {
      const data: { comments: AdminComment[]; nextCursor: number | null } = await request(url);
      if (postSelect.value !== selectedSlug || serial !== requestSerial) return false;
      for (const comment of data.comments) renderComment(comment);
      cursor = data.nextCursor;
      more.hidden = cursor === null;
      if (count) count.textContent = `已加载 ${comments.childElementCount} 条`;
      message.textContent = comments.childElementCount ? '' : '当前没有评论。';
      return true;
    } catch (error) {
      if (serial === requestSerial) message.textContent = error instanceof Error ? error.message : '读取失败。';
      return false;
    } finally {
      if (serial === requestSerial) more.disabled = false;
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
      if (settingsLink) settingsLink.hidden = false;
      if (postSelect.value) await load(true);
      else message.textContent = '暂无文章。';
    }).catch((error: Error) => {
      message.textContent = error.message;
    }).finally(() => {
      if (submit) submit.disabled = false;
    });
  });

  logout.addEventListener('click', () => {
    showLogin();
    message.textContent = '已退出。';
  });
  postSelect.addEventListener('change', () => {
    syncPostItems();
    requestSerial++;
    comments.replaceChildren();
    cursor = null;
    more.hidden = true;
    if (count) count.textContent = '';
    message.textContent = postSelect.value ? '' : '暂无文章。';
    if (postSelect.value) void load(true);
  });
  for (const item of postItems) item.addEventListener('click', () => {
    if (item.dataset.postSlug === postSelect.value) return;
    postSelect.value = item.dataset.postSlug || '';
    postSelect.dispatchEvent(new Event('change'));
  });
  more.addEventListener('click', () => void load());

  if (session && apiUrl) {
    login.hidden = true;
    dashboard.hidden = false;
    if (settingsLink) settingsLink.hidden = false;
    void request(new URL('./profile', apiUrl)).then(() => {
      if (postSelect.value) void load(true);
      else message.textContent = '暂无文章。';
    }).catch((error: Error) => { message.textContent = error.message; });
  }
}
