import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
import { satteri } from '@astrojs/markdown-satteri';
import { markdownTables } from './scripts/markdown-tables.mjs';

const configuredBase = process.env.SITE_BASE?.replace(/\/+$/, '');
const base = configuredBase || '/';

export default defineConfig({
  site: 'https://xtvj.github.io',
  base,
  trailingSlash: 'always',
  integrations: [icon()],
  markdown: {
    processor: satteri({ hastPlugins: [markdownTables] }),
  },
  devToolbar: {
    enabled: false,
  },
});
