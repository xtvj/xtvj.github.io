// Keep playback tied to the media currently in view, including image slides.
export function initInstagramPlayback(root, { isBlocked = () => false } = {}) {
  if (!root) return { refresh() {} };
  const slides = new Set();
  const visibleSlides = new Set();
  const videos = new Set();
  let activeVideo = null;
  let frame = 0;
  let suspended = false;

  const update = () => {
    frame = 0;
    let selectedSlide = null;
    let nearest = Infinity;
    if (!suspended && !document.hidden && !isBlocked()) {
      for (const slide of observer ? visibleSlides : slides) {
        if (!slide.isConnected || slide.hidden) continue;
        const rect = slide.getBoundingClientRect();
        const height = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
        const width = Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0);
        if (width <= 0 || height <= 0 || height / Math.min(rect.height, window.innerHeight) < 0.35) continue;
        const distance = Math.abs((rect.top + rect.bottom) / 2 - window.innerHeight / 2);
        if (distance < nearest) {
          nearest = distance;
          selectedSlide = slide;
        }
      }
    }
    const selectedVideo = selectedSlide?.querySelector('video');
    const next = selectedVideo && !selectedVideo.dataset.failed && !selectedVideo.error ? selectedVideo : null;
    const changed = activeVideo !== next;
    activeVideo = next;
    for (const video of videos) if (video !== next && !video.paused) video.pause();
    if (!next || !changed) return;
    // Muted inline playback works without a prior click. Controls can enable sound.
    next.play()?.then(() => {
      // A pending play may finish after scrolling to a different post.
      if (activeVideo !== next || document.hidden || suspended || isBlocked()) next.pause();
    }).catch(() => {
      // An autoplay denial or an interrupted load keeps the inline player usable.
    });
  };
  const requestUpdate = () => {
    if (!frame) frame = window.requestAnimationFrame(update);
  };
  const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) visibleSlides.add(entry.target);
      else visibleSlides.delete(entry.target);
    }
    requestUpdate();
  }, { threshold: [0, 0.15, 0.35, 0.5, 0.75, 1] }) : null;

  const refresh = () => {
    for (const slide of slides) {
      if (root.contains(slide)) continue;
      observer?.unobserve(slide);
      slides.delete(slide);
      visibleSlides.delete(slide);
    }
    for (const video of videos) {
      if (root.contains(video)) continue;
      video.pause();
      videos.delete(video);
    }
    for (const slide of root.querySelectorAll('.media-slide')) {
      if (!slides.has(slide)) {
        slides.add(slide);
        observer?.observe(slide);
      }
      const video = slide.querySelector('video');
      if (video && !videos.has(video)) {
        video.defaultMuted = true;
        video.muted = true;
        video.playsInline = true;
        videos.add(video);
      }
    }
    requestUpdate();
  };
  root.addEventListener('play', (event) => {
    const video = event.target;
    if (!videos.has(video)) return;
    if (activeVideo !== video || document.hidden || suspended || isBlocked() || video.closest('.media-slide')?.hidden) {
      video.pause();
      return;
    }
    // Keep delayed play events from reviving the previous video.
    for (const other of videos) if (other !== video && !other.paused) other.pause();
  }, true);
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      activeVideo = null;
      for (const video of videos) video.pause();
    } else requestUpdate();
  });
  window.addEventListener('pagehide', () => {
    suspended = true;
    activeVideo = null;
    for (const video of videos) video.pause();
  });
  window.addEventListener('pageshow', () => {
    suspended = false;
    requestUpdate();
  });
  refresh();
  return { refresh };
}