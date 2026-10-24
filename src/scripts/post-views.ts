const apiUrl = import.meta.env.PUBLIC_POST_VIEWS_API_URL;
const counters = [...document.querySelectorAll<HTMLElement>('[data-post-views]')];

if (apiUrl && counters.length) {
  const format = new Intl.NumberFormat('zh-CN');
  const showCount = (slug: string, views: unknown) => {
    if (typeof views !== 'number' || !Number.isSafeInteger(views) || views < 0) return;
    for (const counter of counters) {
      if (counter.dataset.postViews === slug) counter.textContent = format.format(views);
    }
  };

  const currentPost = counters.find((counter) => counter.hasAttribute('data-count-view'));
  if (currentPost?.dataset.postViews) {
    let visitorId: string | undefined;
    try {
      const saved = localStorage.getItem('xtvj-visitor-id');
      visitorId = saved && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(saved) ? saved : crypto.randomUUID();
      localStorage.setItem('xtvj-visitor-id', visitorId);
    } catch {}
    void fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: currentPost.dataset.postViews, visitorId }),
      cache: 'no-store',
    }).then(async (response) => {
      if (!response.ok) throw new Error('Could not record view');
      const data: { slug: string; views: number } = await response.json();
      showCount(data.slug, data.views);
    }).catch(() => {});
  } else {
    const url = new URL(apiUrl);
    for (const slug of new Set(counters.map((counter) => counter.dataset.postViews).filter((slug): slug is string => !!slug))) {
      url.searchParams.append('slug', slug);
    }
    void fetch(url, { cache: 'no-store' }).then(async (response) => {
      if (!response.ok) throw new Error('Could not load views');
      const data: { views: Record<string, number> } = await response.json();
      for (const [slug, views] of Object.entries(data.views)) showCount(slug, views);
    }).catch(() => {});
  }
}
