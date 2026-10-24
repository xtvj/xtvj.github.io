interface Comment {
  id: number;
  parent_id: number | null;
  nickname: string;
  body: string;
  created_at: string;
  avatar_id: string;
  is_admin: number;
}
import { COMMENT_AVATARS, avatarPath } from '../lib/comment-avatars.js';

const section = document.querySelector<HTMLElement>('.comments[data-post-slug]');
const list = document.querySelector<HTMLElement>('#comments-list');
const listStatus = document.querySelector<HTMLElement>('#comments-list-status');
const more = document.querySelector<HTMLButtonElement>('#comments-more');
const form = document.querySelector<HTMLFormElement>('#comment-form');
const formStatus = document.querySelector<HTMLElement>('#comment-form-status');
const nickname = document.querySelector<HTMLInputElement>('#comment-nickname');
const body = document.querySelector<HTMLTextAreaElement>('#comment-body');
const replyLabel = document.querySelector<HTMLElement>('#comment-reply-label');
const cancelReply = document.querySelector<HTMLButtonElement>('#comment-cancel-reply');

if (section && list && listStatus && more && form && formStatus && nickname && body && replyLabel && cancelReply) {
  const apiUrl = section.dataset.commentsApi;
  const slug = section.dataset.postSlug;
  const nodes = new Map<number, HTMLElement>();
  let nextCursor: number | null = null;
  let parentId: number | null = null;
  let adminSession = '';
  const adminIdentity = document.querySelector<HTMLElement>('#comment-admin-identity');
  const guestFields = document.querySelector<HTMLElement>('#comment-guest-fields');
  const turnstileBox = document.querySelector<HTMLElement>('#comment-turnstile');
  const avatarDialog = document.querySelector<HTMLDialogElement>('#comment-avatar-dialog');
  const avatarTrigger = document.querySelector<HTMLButtonElement>('#comment-avatar-trigger');
  const avatarClose = document.querySelector<HTMLButtonElement>('#comment-avatar-close');
  const guestAvatar = document.querySelector<HTMLImageElement>('#comment-guest-avatar');
  const avatarOptions = [...document.querySelectorAll<HTMLButtonElement>('[data-avatar-id]')];
  const visitorId = (() => {
    try {
      const saved = localStorage.getItem('xtvj-visitor-id');
      if (saved && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(saved)) return saved;
      const generated = crypto.randomUUID();
      localStorage.setItem('xtvj-visitor-id', generated);
      return generated;
    } catch { return crypto.randomUUID(); }
  })();
  const avatarKey = 'xtvj-comment-avatar';
  let selectedAvatar = '';
  try { selectedAvatar = localStorage.getItem(avatarKey) || ''; } catch {}
  if (!COMMENT_AVATARS.some((avatar) => avatar.id === selectedAvatar)) {
    selectedAvatar = COMMENT_AVATARS[crypto.getRandomValues(new Uint32Array(1))[0] % COMMENT_AVATARS.length].id;
    try { localStorage.setItem(avatarKey, selectedAvatar); } catch {}
  }
  const showSelectedAvatar = () => {
    if (guestAvatar) guestAvatar.src = avatarPath(selectedAvatar, import.meta.env.BASE_URL);
    for (const option of avatarOptions) option.setAttribute('aria-pressed', String(option.dataset.avatarId === selectedAvatar));
  };
  showSelectedAvatar();
  avatarTrigger?.addEventListener('click', () => avatarDialog?.showModal());
  avatarClose?.addEventListener('click', () => avatarDialog?.close());
  avatarDialog?.addEventListener('click', (event) => { if (event.target === avatarDialog) avatarDialog.close(); });
  for (const option of avatarOptions) option.addEventListener('click', () => {
    const id = option.dataset.avatarId;
    if (!COMMENT_AVATARS.some((avatar) => avatar.id === id)) return;
    selectedAvatar = id!;
    try { localStorage.setItem(avatarKey, selectedAvatar); } catch {}
    showSelectedAvatar();
    avatarDialog?.close();
    avatarTrigger?.focus();
  });
  const setAdmin = (active: boolean, profile?: { nickname: string; avatar_id: string }) => {
    adminSession = active ? adminSession : '';
    if (adminIdentity) adminIdentity.hidden = !active;
    if (guestFields) guestFields.hidden = active;
    if (turnstileBox) turnstileBox.hidden = active;
    if (active) avatarDialog?.close();
    nickname.required = !active;
    const submit = form.querySelector<HTMLButtonElement>('[type="submit"]');
    if (submit) submit.disabled = !active && (!form.querySelector('.cf-turnstile') || !apiUrl);
    if (active && profile) {
      const name = document.querySelector<HTMLElement>('#comment-admin-name');
      const avatar = document.querySelector<HTMLImageElement>('#comment-admin-avatar');
      if (name) name.textContent = profile.nickname;
      if (avatar) avatar.src = avatarPath(profile.avatar_id, import.meta.env.BASE_URL);
      formStatus.textContent = '以管理员身份发表评论。';
    }
  };

  const clearReply = () => {
    parentId = null;
    replyLabel.hidden = true;
    cancelReply.hidden = true;
  };

  const renderComment = (comment: Comment) => {
    if (nodes.has(comment.id)) return;
    const article = document.createElement('article');
    article.className = 'comment';
    article.id = `comment-${comment.id}`;
    const header = document.createElement('div');
    header.className = 'comment-meta';
    const avatar = document.createElement('img');
    avatar.className = 'comment-avatar';
    avatar.src = avatarPath(comment.avatar_id, import.meta.env.BASE_URL);
    avatar.alt = '';
    avatar.width = 36;
    avatar.height = 36;
    const author = document.createElement('strong');
    author.textContent = comment.nickname;
    const time = document.createElement('time');
    time.dateTime = comment.created_at;
    const date = new Date(comment.created_at);
    time.textContent = Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(date);
    header.append(avatar, author);
    if (comment.is_admin) {
      const badge = document.createElement('span');
      badge.className = 'comment-admin-badge';
      badge.textContent = '管理员';
      header.append(badge);
    }
    header.append(time);
    const content = document.createElement('p');
    content.className = 'comment-body';
    content.textContent = comment.body;
    const reply = document.createElement('button');
    reply.className = 'comment-reply';
    reply.type = 'button';
    reply.textContent = '回复';
    reply.addEventListener('click', () => {
      parentId = comment.id;
      replyLabel.textContent = `回复 ${comment.nickname}`;
      replyLabel.hidden = false;
      cancelReply.hidden = false;
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      body.focus({ preventScroll: true });
    });
    const children = document.createElement('div');
    children.className = 'comment-children';
    article.append(header, content, reply, children);
    const parent = comment.parent_id ? nodes.get(comment.parent_id) : undefined;
    (parent?.querySelector('.comment-children') || list).append(article);
    nodes.set(comment.id, article);
  };

  const load = async () => {
    if (!apiUrl || !slug) {
      listStatus.textContent = '评论暂时不可用。';
      return;
    }
    more.disabled = true;
    listStatus.textContent = '正在加载评论…';
    try {
      const url = new URL(apiUrl);
      url.searchParams.set('slug', slug);
      if (nextCursor !== null) url.searchParams.set('cursor', String(nextCursor));
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error('Load failed');
      const data: { comments: Comment[]; nextCursor: number | null } = await response.json();
      for (const comment of data.comments) renderComment(comment);
      nextCursor = data.nextCursor;
      more.hidden = nextCursor === null;
      listStatus.textContent = nodes.size ? '' : '暂无评论，欢迎留下第一条。';
    } catch {
      listStatus.textContent = '评论加载失败，请稍后重试。';
    } finally {
      more.disabled = false;
    }
  };

  more.addEventListener('click', () => void load());
  cancelReply.addEventListener('click', clearReply);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!apiUrl || !slug) return;
    const token = form.querySelector<HTMLInputElement>('[name="cf-turnstile-response"]')?.value;
    if (!adminSession && !token) {
      formStatus.textContent = '请先完成安全验证。';
      return;
    }
    const submit = form.querySelector<HTMLButtonElement>('[type="submit"]');
    if (submit) submit.disabled = true;
    formStatus.textContent = '正在提交…';
    void fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(adminSession ? { Authorization: `Bearer ${adminSession}` } : {}) },
      body: JSON.stringify({ slug, nickname: nickname.value, body: body.value, parentId, turnstileToken: token, visitorId, avatarId: selectedAvatar }),
      cache: 'no-store',
    }).then(async (response) => {
      if (response.status === 429) throw new Error('操作太频繁，请稍后再试。');
      if (response.status === 401) {
        try { sessionStorage.removeItem('xtvj-admin-session'); } catch {}
        setAdmin(false);
        throw new Error('管理员登录已失效，请完成安全验证后重试。');
      }
      if (!response.ok) throw new Error(response.status === 400 ? '提交失败，请检查内容并重新完成验证。' : '提交失败，请稍后再试。');
      const data: { comment: Comment } = await response.json();
      renderComment(data.comment);
      listStatus.textContent = '';
      body.value = '';
      clearReply();
      formStatus.textContent = '评论已发表。';
    }).catch((error: Error) => {
      formStatus.textContent = error.message;
    }).finally(() => {
      if (submit) submit.disabled = false;
      const turnstile = (window as Window & { turnstile?: { reset: () => void } }).turnstile;
      if (!adminSession) turnstile?.reset();
    });
  });

  try { adminSession = sessionStorage.getItem('xtvj-admin-session') || ''; } catch {}
  if (adminSession && apiUrl) {
    void fetch(new URL('./admin/profile', apiUrl), { headers: { Authorization: `Bearer ${adminSession}` }, cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 401) {
          try { sessionStorage.removeItem('xtvj-admin-session'); } catch {}
          setAdmin(false);
          return;
        }
        if (!response.ok) throw new Error('Profile unavailable');
        const data: { profile: { nickname: string; avatar_id: string } } = await response.json();
        setAdmin(true, data.profile);
      }).catch(() => {
        formStatus.textContent = '暂时无法确认管理员身份，请稍后刷新页面重试。';
      });
  }
  void load();
}
