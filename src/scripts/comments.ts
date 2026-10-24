interface Comment {
  id: number;
  parent_id: number | null;
  nickname: string;
  body: string;
  created_at: string;
}

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
    const author = document.createElement('strong');
    author.textContent = comment.nickname;
    const time = document.createElement('time');
    time.dateTime = comment.created_at;
    const date = new Date(comment.created_at);
    time.textContent = Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(date);
    header.append(author, time);
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
    if (!token) {
      formStatus.textContent = '请先完成安全验证。';
      return;
    }
    const submit = form.querySelector<HTMLButtonElement>('[type="submit"]');
    if (submit) submit.disabled = true;
    formStatus.textContent = '正在提交…';
    void fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, nickname: nickname.value, body: body.value, parentId, turnstileToken: token }),
      cache: 'no-store',
    }).then(async (response) => {
      if (response.status === 429) throw new Error('操作太频繁，请稍后再试。');
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
      turnstile?.reset();
    });
  });

  void load();
}
