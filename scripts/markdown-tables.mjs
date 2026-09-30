// Apply optional frontmatter column widths while keeping Markdown tables editable.
export const markdownTables = {
  name: 'markdown-table-layout',
  element: {
    filter: ['table'],
    visit(node, context) {
      const layout = context.data.astro?.frontmatter?.tableLayout;
      if (!layout) return;

      const { columns, width = 100, minWidth = 900 } = layout;
      if (!Array.isArray(columns) || columns.length === 0 ||
          columns.some((value) => typeof value !== 'number' || !Number.isFinite(value) || value <= 0) ||
          Math.abs(columns.reduce((sum, value) => sum + value, 0) - 100) > 0.001 ||
          !Number.isFinite(width) || width <= 0 || width > 100 ||
          !Number.isFinite(minWidth) || minWidth < 0) {
        throw new Error('tableLayout：columns 请填写合计为 100 的正数百分比，width 为 1–100，minWidth 为非负像素数。');
      }

      const heading = node.children.find((child) => child.type === 'element' && child.tagName === 'thead');
      const row = heading?.children.find((child) => child.type === 'element' && child.tagName === 'tr');
      const count = row?.children.filter((child) => child.type === 'element' && ['th', 'td'].includes(child.tagName)).length;
      if (count !== columns.length) {
        throw new Error(`tableLayout：配置了 ${columns.length} 列宽，但表格实际有 ${count} 列。请按表格从左到右填写全部列宽。`);
      }

      context.prependChild(node, {
        type: 'element',
        tagName: 'colgroup',
        properties: {},
        children: columns.map((width) => ({
          type: 'element',
          tagName: 'col',
          properties: { style: `width: ${width}%` },
          children: [],
        })),
      });
      context.wrapNode(node, {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['table-scroll'],
          tabIndex: 0,
          role: 'region',
          ariaLabel: '文章表格，可左右滚动',
          style: `--table-width: ${width}%; --table-min-width: ${minWidth}px`,
        },
        children: [],
      });
    },
  },
};
