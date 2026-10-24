# XTVJ 的博客（Astro）

这是 [xtvj.github.io](https://xtvj.github.io/) 的 Astro 静态站点源码。文章存放在 `src/content/posts/`，每篇文章都是带 frontmatter 的 Markdown 文件，可直接编辑。

## 本地预览

项目使用 Astro 7，需要 Node.js 22.12 或更高版本：

```sh
npm install
npm run dev
```

正式构建和预览：

```sh
npm run build
npm run preview
```

构建文件输出到 `dist/`。

## 部署到 GitHub Pages

项目已包含 `.github/workflows/deploy.yml`。将源码提交到 `xtvj/xtvj.github.io` 仓库的 `main` 分支后，GitHub Actions 会自动构建并发布。

在 GitHub 仓库的 **Settings → Pages → Build and deployment** 中，将 **Source** 设为 **GitHub Actions**。之后每次推送到 `main` 都会触发部署，也可以在 Actions 页面手动运行工作流。

该域名是 `xtvj.github.io` 用户站点，因此默认部署在站点根路径，不需要配置子目录。若将项目部署到普通仓库的 `username.github.io/repository/` 路径，可在构建时设置 `SITE_BASE=/repository`。

## Instagram 页面

页面打开时会请求 Cloudflare Worker，由 Worker 使用私密 token 读取 @xtvjdev 的最新 12 篇帖子；点击“加载更多帖子”可继续按页读取，直到所有可访问的帖子加载完。页面每次访问都会发起请求，Worker 将每页结果缓存 60 秒以减少 Instagram API 请求。账号头像及帖子中的照片、视频/Reel、图集（含混合图片和视频）、日期、完整文案、类型、赞数、评论数和原帖链接会显示在每条记录中。构建时会缓存账号头像，实时接口返回新头像后页面会更新。视频进入视口后在页面内静音自动播放，滚出视口、切到图片或离开页面时暂停，同一时间只播放当前的一段视频；可使用播放器控件开启声音。若 Instagram 未提供可播放地址或地址失效，媒体区域保留封面及状态提示，可从帖子信息中的“查看原帖”打开 Instagram。若实时接口暂时不可用，页面会保留并显示构建时生成的最近缓存。

Instagram 这里使用授权生成的 User Access Token，不是 API key。账号必须是 Creator（创作者）或 Business（企业）专业账号。Meta 当前读取媒体需要 instagram_business_basic 权限，流程及账号要求以 Meta Instagram Platform 文档为准：
https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login

### 一次性配置实时接口

1. 在 Meta for Developers 创建应用，添加 Instagram Login/API 产品，授权 @xtvjdev，申请 instagram_business_basic 权限并生成 User Access Token。
2. 安装 Wrangler 并登录 Cloudflare：npm install --global wrangler、npx wrangler login。
3. 在项目根目录执行 npx wrangler deploy --config workers/instagram-api/wrangler.toml。部署完成会得到类似 https://xtvj-instagram-api.<你的子域>.workers.dev 的地址。
4. 设置 Worker secret：npx wrangler secret put INSTAGRAM_ACCESS_TOKEN --config workers/instagram-api/wrangler.toml，按提示粘贴 token。token 只存于 Cloudflare，不会下发给浏览器。
5. 在 GitHub 仓库 Settings → Secrets and variables → Actions → Variables 新增 PUBLIC_INSTAGRAM_API_URL，值为 Worker 地址加 /api/instagram，例如 https://xtvj-instagram-api.example.workers.dev/api/instagram。
6. 重新部署 GitHub Pages。工作流会把公开的 Worker 地址编进页面；每次访客打开 Instagram 页面时就会获取最新帖子。

修改媒体返回字段后，必须重新部署 Worker 和网站；旧版 Worker 只返回视频封面，更新网站本身无法补出视频源。Worker 代码位于 workers/instagram-api/。wrangler.toml 默认只允许 https://xtvj.github.io 和本地 Astro 开发地址访问；若网站使用自定义域名，请同步修改 ALLOWED_ORIGIN 并重新部署。部署 Worker 后可用 npx wrangler secret put INSTAGRAM_ACCESS_TOKEN --config workers/instagram-api/wrangler.toml 更新 token。也可以另外在 GitHub Actions secret 设置 INSTAGRAM_ACCESS_TOKEN，这样构建阶段也会更新离线回退缓存；这不是实时接口运行所必需的。

## 文章阅读次数

文章详情页打开时会向 Cloudflare Worker 发送计数请求；同一浏览器和文章在 24 小时内重复刷新不会再次计数。Worker 将浏览器随机 ID 与访客 IP、浏览器标识经服务端密钥做 HMAC 后用于去重；D1 不保存原始 IP。换浏览器、清理浏览器数据或伪造请求仍可能产生新计数，因此这不是唯一访客统计。首页、分页、标签和搜索列表只批量读取，不增加次数。页面构建时先显示 Markdown frontmatter 中的历史 `views`，接口返回后更新为实时值；接口暂时不可用时保留历史值。

首次部署需要 Cloudflare 账号，并安装/登录 Wrangler：

```sh
npx wrangler login
npx wrangler d1 create xtvj-post-views
```

将创建结果中的 `database_id` 填入 `workers/post-views/wrangler.toml`，替换 `REPLACE_WITH_D1_DATABASE_ID`。然后从项目根目录执行：

```sh
npx wrangler d1 execute xtvj-post-views --remote --file=workers/post-views/schema.sql --config workers/post-views/wrangler.toml
npx wrangler d1 execute xtvj-post-views --remote --file=workers/post-views/comments.sql --config workers/post-views/wrangler.toml
npx wrangler d1 execute xtvj-post-views --remote --file=workers/post-views/comment-identity.sql --config workers/post-views/wrangler.toml
node scripts/reset-admin-password.mjs
```

`schema.sql` 会建立阅读数表，并将现有文章 frontmatter 中的旧阅读数作为初始值写入 D1。`comments.sql` 新增评论表和阅读去重表；`comment-identity.sql` 为评论增加头像及管理员标记，并建立管理员资料表。它们不会清空现有阅读数或评论。每个 SQL 文件只运行一次。`reset-admin-password.mjs` 会提示输入两次密码、创建管理密码表、把旧的待审核评论公开，并把加盐密码哈希写入远程 D1。

部署和密钥配置见下方“评论系统”。在 GitHub 仓库 **Settings → Secrets and variables → Actions → Variables** 设置 `PUBLIC_POST_VIEWS_API_URL`，值为 Worker 地址加 `/api/views`，例如 `https://xtvj-post-views.example.workers.dev/api/views`。重新部署 GitHub Pages 后，页面才会读取和记录次数。本地开发可将同一变量放入项目根目录 `.env` 文件。如果使用自定义站点域名，修改 Worker 配置中的 `ALLOWED_ORIGIN` 后重新部署。

新增文章可直接发布：首次访问详情页时，D1 会为新 slug 建立从 1 开始的统计记录。修改文章 slug 会被视为新文章；如需保留旧次数，先在 D1 中迁移对应的 `slug`。

## 评论系统

每篇文章按 frontmatter 中的 `slug` 分开存储评论。游客填写昵称和正文，点击头像可从四张画像中选择；首次会随机选中一张，选择保存在当前浏览器，之后的评论继续使用同一头像。更换头像只影响之后发表的评论。完成 Turnstile 验证后提交，评论和回复会立即公开。回复支持多级嵌套，评论正文按纯文本显示，不执行 HTML。公开接口每次最多读取 50 条，可继续加载；管理员可通过网站页脚的“评论管理”入口按文章查看和删除垃圾评论。

1. 在 Cloudflare Turnstile 创建一个 Widget，允许的 hostname 填 `xtvj.github.io`。取得公开的 **site key** 和私密的 **secret key**；本地调试可另外使用允许 `localhost` 的测试 Widget。
2. 在项目根目录执行上方的 D1 初始化命令。继续使用 `workers/post-views/wrangler.toml` 中现有的 D1 绑定及数据库 ID。已经运行过 `schema.sql` 和 `comments.sql` 的站点，本次只需执行下面的迁移命令；如尚未设置管理密码，再运行 `node scripts/reset-admin-password.mjs`。先迁移 D1，再部署新 Worker。

   ```sh
   npx wrangler d1 execute xtvj-post-views --remote --file=workers/post-views/comment-identity.sql --config workers/post-views/wrangler.toml
   ```
3. 生成一个随机密钥用作阅读数 HMAC 密钥和管理员会话签名密钥。例如执行 `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`，并妥善保存结果。
4. 使用以下命令将私密值写入 Cloudflare Worker Secrets。每条命令会提示输入对应的值，**不要**将真实值写入 `wrangler.toml`、网站 `.env` 或 Git 仓库：

   ```sh
   npx wrangler secret put TURNSTILE_SECRET_KEY --config workers/post-views/wrangler.toml
   npx wrangler secret put VIEW_HASH_SECRET --config workers/post-views/wrangler.toml
   npx wrangler deploy --config workers/post-views/wrangler.toml
   ```

5. 在 GitHub Actions **Variables** 中设置 `PUBLIC_TURNSTILE_SITE_KEY` 为公开的 site key，并保留 `PUBLIC_POST_VIEWS_API_URL`。重新部署 GitHub Pages。`PUBLIC_TURNSTILE_SITE_KEY` 是公开标识，可以出现在前端；Turnstile secret 和 `VIEW_HASH_SECRET` 只存在 Cloudflare Worker Secrets 中。旧的 `ADMIN_TOKEN` 不再使用，可执行 `npx wrangler secret delete ADMIN_TOKEN --config workers/post-views/wrangler.toml` 清理。

现有 Worker 如果此前没有配置上述 Secrets，更新后的评论提交和阅读计数会返回 503，直到密钥写入。评论读取和历史阅读数显示仍可用。Worker 已按 IP 与浏览器标识配置每分钟最多 3 次评论提交、30 次阅读计数请求的近似限流；管理密码登录每 IP 每分钟最多尝试 5 次。Turnstile token 会在 Worker 中向 Cloudflare 验证，并检查 hostname 和 action。阅读记录超过 30 天会由每日定时任务清理。使用自定义域名时，需同步修改 `ALLOWED_ORIGIN` 和 Turnstile Widget 的允许 hostname。

### 管理评论与密码

打开 `https://xtvj.github.io/admin/`（页脚也有“评论管理”入口），输入管理密码后默认显示最新文章的评论。文章与首页一样按发布时间从新到旧排列；宽屏双栏模式可在左侧列表点击切换文章，窄屏则使用下拉菜单。管理员设置页在桌面宽度下使用宽屏容器，资料和密码表单并排显示。密码不写入网站源码或浏览器存储；浏览器标签页仅保存有效期为 12 小时的签名会话，关闭标签页或退出后会清除。昵称和 Turnstile 验证不会赋予管理员身份。密码至少 8 个字符；请只在自己信任的设备上管理评论。

登录后从管理页面进入 `https://xtvj.github.io/admin/settings/`，可修改管理员昵称、在摩西、路得、大卫、抹大拉的马利亚四张默认画像中选择头像，也可填写当前密码和新密码修改密码。管理员登录期间，在文章页发表评论会使用管理员头像和昵称并显示“管理员”标记；Worker 会验证签名会话，不能靠前端填写昵称冒充。修改资料会更新已有管理员评论的显示信息。修改密码后其他标签页的旧会话立即失效。忘记密码时，在**项目根目录**运行以下命令；它会隐藏密码输入，经 Wrangler 登录的 Cloudflare 账号更新远程 D1 并使旧会话失效：

```sh
node scripts/reset-admin-password.mjs
```

如需本地测试，可使用 `node scripts/reset-admin-password.mjs --local`，它只更新 Wrangler 的本地 D1。远程重置需要 Wrangler 已登录并可访问 `xtvj-post-views` 数据库。命令只上传随机盐和密码哈希，不把明文密码写入 Git 或命令参数。删除某条评论后，其已公开的回复会作为顶层评论保留。修改 Worker 或网站代码后，分别重新执行 Worker 部署命令并重新运行 GitHub Pages 部署。

## 文章与页面

- 首页展示最新 10 篇文章，其余文章在下一页。
- 每篇文章单独生成静态详情页；标签归档和站内搜索也会在构建时生成。
- 文章 URL 继续使用旧站 `/posts/<原 slug>/` 的形式。
- 关于页和页脚保留了原站名称、版权年份与 CC BY-NC-SA 4.0 标记。
- 图片原件放在项目根目录的 `images/`；运行开发服务器或构建时会同步到 `public/images/`，发布后可通过 `/images/...` 访问。
- 右上角“显示设置”默认自动调整页面宽度：浏览器窗口宽度达到 1280px 时使用宽屏布局，较窄时使用标准布局；也可手动固定为标准或宽屏。字体大小和主题选择保存在当前浏览器中。
- Astro 开发工具栏已关闭，不会显示 Astro 的悬浮按钮。

旧站图标文件已复制到 `public/` 与 `public/icons/`，会随 Astro 构建发布。后续可删除 `xtvj.github.io-main/` 文件夹；`images/` 和 `public/` 中已保留网站所需的资源。

## Markdown 表格列宽

表格继续使用 `| 表头 | 表头 |` 的 Markdown 写法。在文章顶部两个 `---` 之间加入以下配置即可控制列宽，不用手写 HTML 或在正文中放 CSS：

```yaml
tableLayout:
  width: 98
  minWidth: 900
  columns: [5, 12, 12, 7, 10, 10, 44]
```

- `width`：表格占正文宽度的百分比，省略时为 `100`。
- `minWidth`：表格最小宽度，单位像素，省略时为 `900`。正文比这个值窄时，表格可以单独左右滚动；此时最小宽度优先于 `width`。设为 `0` 可取消最小宽度。
- `columns`：从左到右每一列的百分比，必须与实际列数一致，总和为 `100`。上面的七个值对应《影视观后记录》的序号、影片名、中文名、年代、观看日期、类型、观后记录。

该配置作用于这篇文章里的所有表格，因此它们需要有相同的列数。单元格内文字会自动换行；没有配置 `tableLayout` 的文章沿用原来的表格样式。列数或百分比填写错误时，构建会给出错误提示。
