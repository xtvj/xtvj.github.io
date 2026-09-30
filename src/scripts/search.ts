const input = document.querySelector<HTMLInputElement>('#search-input');
const results = document.querySelector<HTMLElement>('#search-results');
const status = document.querySelector<HTMLElement>('#search-status');

if (input && results && status) {
  const params = new URLSearchParams(window.location.search);
  input.value = params.get('q') ?? '';
  let indexPromise: Promise<Array<{title: string; tags: string[]; href: string}>> | undefined;

  const render = async () => {
    const query = input.value.trim().toLocaleLowerCase();
    if (!query) {
      results.replaceChildren();
      status.textContent = '输入关键词，搜索标题和标签。';
      return;
    }

    status.textContent = '正在搜索…';
    indexPromise ??= fetch(`${import.meta.env.BASE_URL}search-index.json`).then((response) => response.json());
    const posts = await indexPromise;
    const matches = posts.filter((post) => `${post.title} ${post.tags.join(' ')}`.toLocaleLowerCase().includes(query));

    results.innerHTML = matches.map((post) => `
      <article class="search-result">
        <h2><a href="${post.href}">${escapeHtml(post.title)}</a></h2>
        <div class="post-tags">${post.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
      </article>
    `).join('');
    status.textContent = matches.length ? `找到 ${matches.length} 篇文章。` : '没有找到匹配的文章。';
  };

  input.addEventListener('input', () => void render());
  void render();
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char] ?? char);
}
