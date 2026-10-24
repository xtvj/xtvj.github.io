const input = document.querySelector<HTMLInputElement>('#search-input');
const results = document.querySelector<HTMLElement>('#search-results');
const status = document.querySelector<HTMLElement>('#search-status');

if (input && results && status) {
  const params = new URLSearchParams(window.location.search);
  input.value = params.get('q') ?? '';
  let indexPromise: Promise<Array<{title: string; tags: string[]; href: string; slug: string; views: number}>> | undefined;
  let renderId = 0;

  const render = async () => {
    const thisRender = ++renderId;
    const query = input.value.trim().toLocaleLowerCase();
    if (!query) {
      results.replaceChildren();
      status.textContent = '输入关键词，搜索标题和标签。';
      return;
    }

    status.textContent = '正在搜索…';
    indexPromise ??= fetch(`${import.meta.env.BASE_URL}search-index.json`).then((response) => response.json());
    const posts = await indexPromise;
    if (thisRender !== renderId) return;
    const matches = posts.filter((post) => `${post.title} ${post.tags.join(' ')}`.toLocaleLowerCase().includes(query));

    results.innerHTML = matches.map((post) => `
      <article class="search-result">
        <h2><a href="${post.href}">${escapeHtml(post.title)}</a></h2>
        <div class="post-tags">${post.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
        <div class="post-stats">阅读 <span data-search-views="${escapeHtml(post.slug)}">${post.views.toLocaleString('zh-CN')}</span> 次</div>
      </article>
    `).join('');
    status.textContent = matches.length ? `找到 ${matches.length} 篇文章。` : '没有找到匹配的文章。';
    const apiUrl = import.meta.env.PUBLIC_POST_VIEWS_API_URL;
    if (!apiUrl) return;
    for (let offset = 0; offset < matches.length; offset += 50) {
      const url = new URL(apiUrl);
      for (const post of matches.slice(offset, offset + 50)) url.searchParams.append('slug', post.slug);
      void fetch(url, { cache: 'no-store' }).then(async (response) => {
        if (!response.ok || thisRender !== renderId) return;
        const data: { views: Record<string, number> } = await response.json();
        if (thisRender !== renderId) return;
        for (const counter of results.querySelectorAll<HTMLElement>('[data-search-views]')) {
          const views = data.views[counter.dataset.searchViews ?? ''];
          if (Number.isSafeInteger(views) && views >= 0) counter.textContent = views.toLocaleString('zh-CN');
        }
      }).catch(() => {});
    }
  };

  input.addEventListener('input', () => void render());
  void render();
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char] ?? char);
}
