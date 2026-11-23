import assert from 'node:assert/strict';
import test from 'node:test';
import { createSatteriMarkdownProcessor } from '@astrojs/markdown-satteri';
import { markdownTables } from './markdown-tables.mjs';

const processor = await createSatteriMarkdownProcessor({
  syntaxHighlight: false,
  hastPlugins: [markdownTables],
});
const table = '| A | B |\n| --- | --- |\n| one | two |';
const threeColumns = '| A | B | C |\n| --- | --- | --- |\n| one | two | three |';
const render = async (markdown, frontmatter) => (await processor.render(markdown, { frontmatter })).code;
const wrappers = (html) => [...html.matchAll(/--table-width: ([\d.]+)%; --table-min-width: ([\d.]+)px/g)].map((match) => match.slice(1));

test('each numbered layout applies to its corresponding table with different column counts', async () => {
  const html = await render([table, threeColumns, table].join('\n\n'), {
    tableLayout: { width: 98, minWidth: 900, columns: [12, 88] },
    tableLayout2: { width: 90, minWidth: 700, columns: [20, 30, 50] },
    tableLayout3: { width: 80, minWidth: 0, columns: [40, 60] },
  });
  assert.deepEqual(wrappers(html), [['98', '900'], ['90', '700'], ['80', '0']]);
  assert.match(html, /width: 12%/);
  assert.match(html, /width: 50%/);
  assert.match(html, /width: 60%/);
});

test('unconfigured tables count toward numbering and keep their default layout', async () => {
  const html = await render([table, table, threeColumns].join('\n\n'), {
    tableLayout3: { columns: [20, 30, 50] },
  });
  assert.deepEqual(wrappers(html), [['100', '900']]);
  assert.equal((html.match(/<colgroup>/g) ?? []).length, 1);
  assert.ok(html.indexOf('table-scroll') > html.indexOf('</table>'));
});

test('the first layout is not inherited by subsequent tables', async () => {
  const html = await render([table, threeColumns].join('\n\n'), {
    tableLayout: { columns: [12, 88] },
  });
  assert.equal(wrappers(html).length, 1);
});

test('table numbering resets for every article and supports double digits', async () => {
  const frontmatter = { tableLayout10: { width: 85, columns: [30, 70] } };
  const markdown = Array(10).fill(table).join('\n\n');
  const results = await Promise.all(Array.from({ length: 3 }, () => render(markdown, frontmatter)));
  for (const html of results) assert.deepEqual(wrappers(html), [['85', '900']]);
});

test('validation errors identify the numbered layout', async () => {
  await assert.rejects(render([table, threeColumns].join('\n\n'), {
    tableLayout2: { columns: [12, 88] },
  }), /tableLayout2：配置了 2 列宽，但表格实际有 3 列/);
  await assert.rejects(render([table, table].join('\n\n'), {
    tableLayout2: { columns: [20, 20] },
  }), /tableLayout2：columns/);
});
