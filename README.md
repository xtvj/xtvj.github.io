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

## 文章与页面

- 首页展示最新 10 篇文章，其余文章在下一页。
- 每篇文章单独生成静态详情页；标签页、标签归档和站内搜索也会在构建时生成。
- 文章 URL 继续使用旧站 `/posts/<原 slug>/` 的形式。
- 关于页和页脚保留了原站名称、版权年份与 CC BY-NC-SA 4.0 标记。
- 图片原件放在项目根目录的 `images/`；运行开发服务器或构建时会同步到 `public/images/`，发布后可通过 `/images/...` 访问。
- 右上角“显示设置”可切换标准/宽屏、调整字体大小，以及选择跟随系统、日间或夜间主题；选择保存在当前浏览器中。
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
