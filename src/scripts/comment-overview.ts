import { avatarPath } from '../lib/comment-avatars.js';

interface RecentComment {
  id: number;
  post_slug: string;
  nickname: string;
  body: string;
  created_at: string;
  avatar_id: string;
  is_admin: number;
}

const viewsApiUrl = import.meta.env.PUBLIC_POST_VIEWS_API_URL;
const counters = [...document.querySelectorAll<HTMLElement>('[data-comment-count]')];
const recentSection = document.querySelector<HTMLElement>('[data-recent-comments]');

if (counters.length || recentSection) {
  const status = recentSection?.querySelector<HTMLElement>('[data-recent-status]');
  const track = recentSection?.querySelector<HTMLElement>('[data-recent-track]');
  if (!viewsApiUrl) {
    if (status) status.textContent = '最新评论暂时不可用。';
  } else {
    const url = new URL('./comment-overview', viewsApiUrl);
    const slugs = [...new Set(counters.map((counter) => counter.dataset.commentCount).filter((slug): slug is string => !!slug))];
    for (const slug of slugs) url.searchParams.append('slug', slug);
    if (recentSection) url.searchParams.set('recent', '1');
    const refresh = () => {
      void fetch(url, { cache: 'no-store' }).then(async (response) => {
        if (!response.ok) throw new Error('Could not load comments');
        const data: { counts: Record<string, number>; recent: RecentComment[] } = await response.json();
        for (const counter of counters) {
          const count = data.counts[counter.dataset.commentCount || ''];
          if (Number.isSafeInteger(count) && count >= 0) counter.textContent = count.toLocaleString('zh-CN');
        }
        if (!recentSection || !status || !track) return;
        if (!data.recent.length) {
          track.replaceChildren();
          status.textContent = '还没有评论。';
          status.hidden = false;
          return;
        }
        let titles: Record<string, string> = {};
        try { titles = JSON.parse(recentSection.dataset.postTitles || '{}'); } catch {}
        const cards = data.recent.map((comment) => {
          const card = document.createElement('a');
          card.className = 'recent-comment-card';
          card.href = `${import.meta.env.BASE_URL}posts/${encodeURIComponent(comment.post_slug)}/#comment-${comment.id}`;
          const header = document.createElement('div');
          header.className = 'recent-comment-author';
          const avatar = document.createElement('img');
          avatar.src = avatarPath(comment.avatar_id, import.meta.env.BASE_URL);
          avatar.width = 34;
          avatar.height = 34;
          avatar.alt = '';
          const name = document.createElement('strong');
          name.textContent = comment.nickname;
          const date = document.createElement('time');
          date.dateTime = comment.created_at;
          const parsed = new Date(comment.created_at);
          date.textContent = Number.isNaN(parsed.getTime()) ? '' : new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', timeZone: 'America/Los_Angeles' }).format(parsed);
          header.append(avatar, name, date);
          const body = document.createElement('p');
          body.className = 'recent-comment-body';
          body.textContent = comment.body;
          const article = document.createElement('span');
          article.className = 'recent-comment-post';
          article.textContent = `↗ ${titles[comment.post_slug] || comment.post_slug}`;
          card.append(header, body, article);
          return card;
        });
        track.replaceChildren(...cards);
        status.hidden = true;
      }).catch(() => {
        if (status) {
          status.textContent = '最新评论加载失败，请稍后刷新。';
          status.hidden = false;
        }
      });
    };
    refresh();
    window.addEventListener('comments-changed', refresh);
  }
}
