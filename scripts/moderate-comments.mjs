const [action, argument, cursor] = process.argv.slice(2);
const baseUrl = process.env.BLOG_API_URL;
const token = process.env.BLOG_ADMIN_TOKEN;

if (!baseUrl || !token || !['list', 'approve', 'delete'].includes(action)) {
  console.error('Set BLOG_API_URL and BLOG_ADMIN_TOKEN, then run: node scripts/moderate-comments.mjs list [pending|approved] [cursor] | approve <id> | delete <id>');
  process.exit(1);
}

let path;
let method = 'GET';
if (action === 'list') {
  const status = argument || 'pending';
  if (!['pending', 'approved'].includes(status)) throw new Error('Status must be pending or approved.');
  if (cursor !== undefined && (!/^\d+$/.test(cursor) || !Number.isSafeInteger(Number(cursor)))) throw new Error('Invalid cursor.');
  path = `/api/admin/comments?status=${status}${cursor === undefined ? '' : `&cursor=${cursor}`}`;
} else {
  const id = Number(argument);
  if (!Number.isSafeInteger(id) || id < 1) throw new Error('A positive comment ID is required.');
  path = `/api/admin/comments/${id}${action === 'approve' ? '/approve' : ''}`;
  method = action === 'approve' ? 'POST' : 'DELETE';
}

const url = new URL(path, baseUrl);
const response = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` } });
const result = await response.json();
console.log(JSON.stringify(result, null, 2));
if (!response.ok) process.exitCode = 1;
