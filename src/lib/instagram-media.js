const videoTypes = new Set(['VIDEO', 'REELS']);

export const instagramMediaFields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,like_count,comments_count,children{id,media_type,media_url,thumbnail_url}';

export function normalizeInstagramPost(post) {
  const type = post.mediaType || post.media_type || 'IMAGE';
  const rawItems = Array.isArray(post.media) && post.media.length
    ? post.media
    : type === 'CAROUSEL_ALBUM' && post.children?.data?.length
      ? post.children.data
      : [post];
  const media = rawItems.map((item) => {
    const itemType = item.type || item.media_type || (videoTypes.has(type) ? 'VIDEO' : 'IMAGE');
    const url = item.url || item.media_url || (videoTypes.has(itemType) ? post.videoUrl : null) || null;
    const thumbnailUrl = item.thumbnailUrl || item.thumbnail_url || null;
    return { type: videoTypes.has(itemType) ? 'VIDEO' : itemType === 'CAROUSEL_ALBUM' ? 'IMAGE' : itemType, url, thumbnailUrl };
  });
  if (!media.some((item) => item.url || item.thumbnailUrl) && (post.image || post.imageUrl)) {
    media[0] = { type: videoTypes.has(type) ? 'VIDEO' : 'IMAGE', url: videoTypes.has(type) ? null : post.image || post.imageUrl, thumbnailUrl: videoTypes.has(type) ? post.image || post.imageUrl : null };
  }
  return {
    id: post.id,
    caption: post.caption || '',
    mediaType: type,
    media,
    permalink: post.permalink,
    timestamp: post.timestamp,
    likes: post.likes ?? post.like_count ?? null,
    comments: post.comments ?? post.comments_count ?? null,
  };
}