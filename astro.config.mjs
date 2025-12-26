// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://Hattori-Iwakura.github.io',
	// Nếu deploy vào repo không phải USERNAME.github.io, 
	// hãy uncomment dòng dưới và thay YOUR_REPO bằng tên repo:
	// base: '/YOUR_REPO',
	integrations: [mdx(), sitemap()],
});
