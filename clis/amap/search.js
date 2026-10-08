import { cli, Strategy } from '@jackwener/opencli/registry';

export const command = cli({
  site: 'amap',
  name: 'search',
  access: 'read',
  description: '通过高德地图 SSR 搜索引擎 (ditu.amap.com/ssr/search) 程序化精准检索 POI 地点与详情',
  example: 'opencli amap search 深圳北站 -f json\nopencli amap search "阳朔西街 咖啡馆"',
  domain: 'ditu.amap.com',
  strategy: Strategy.COOKIE,
  browser: true,
  navigateBefore: false,
  args: [
    { name: 'query', positional: true, required: true, help: '搜索地点关键词 (如: 深圳北站, 阳朔遇龙河)' },
    { name: 'limit', type: 'int', default: 20, help: '返回结果数量上限 (默认 20)' }
  ],
  columns: [
    'title',
    'address',
    'tags',
    'image',
    'search_url'
  ],
  func: async (page, kwargs) => {
    const query = String(kwargs.query || '').trim();
    if (!query) throw new Error('Query parameter is required');

    const searchUrl = `https://ditu.amap.com/ssr/search?query=${encodeURIComponent(query)}&query_type=TQUERY`;
    await page.evaluate((url) => {
      window.location.href = url;
    }, searchUrl);
    await page.wait(3.5);

    // Dismiss baxia dialog if it popped up
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.baxia-dialog-close');
      if (closeBtn) closeBtn.click();
    });

    await page.wait(1.5);

    const results = await page.evaluate(({ qUrl, limit }) => {
      const cards = Array.from(document.querySelectorAll('.poi-card'));
      return cards.slice(0, limit).map(c => {
        const title = c.querySelector('.poi-card-title, [class*="title"]')?.textContent?.trim() || '';
        const address = c.querySelector('.poi-card-address, [class*="address"]')?.textContent?.trim() || '';
        const tags = Array.from(c.querySelectorAll('[class*="tag"], [class*="Tag"]'))
          .map(t => t.textContent?.trim())
          .filter(Boolean)
          .join(' | ');
        const img = c.querySelector('img')?.src || '';

        return {
          title,
          address,
          tags,
          image: img,
          search_url: qUrl
        };
      });
    }, { qUrl: searchUrl, limit: Number(kwargs.limit) || 20 });

    return results;
  }
});
