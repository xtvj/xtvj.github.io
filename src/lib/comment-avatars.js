export const COMMENT_AVATARS = [
  { id: 'moses', name: '摩西' },
  { id: 'ruth', name: '路得' },
  { id: 'david', name: '大卫' },
  { id: 'mary-magdalene', name: '抹大拉的马利亚' },
];

export function avatarPath(id, base = '/') {
  const selected = COMMENT_AVATARS.some((avatar) => avatar.id === id) ? id : 'moses';
  return `${base}avatars/${selected}.webp`;
}
