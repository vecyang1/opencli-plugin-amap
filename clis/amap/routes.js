import { cli, Strategy } from '@jackwener/opencli/registry';
import { getAmapLocalStorage, parseRoutes } from './_shared.js';

export const command = cli({
  site: 'amap',
  name: 'routes',
  access: 'read',
  description: '查询高德地图收藏路线及导航历史记录',
  example: 'opencli amap routes -f json\nopencli amap routes 深圳 --limit 10',
  domain: 'ditu.amap.com',
  strategy: Strategy.COOKIE,
  browser: true,
  navigateBefore: false,
  args: [
    { name: 'query', positional: true, required: false, help: '起点或终点关键词' },
    { name: 'limit', type: 'int', default: 30, help: '返回数量上限 (默认 30)' }
  ],
  columns: [
    'route_name',
    'start_name',
    'end_name',
    'method',
    'distance_meters',
    'duration_seconds',
    'updated_at'
  ],
  func: async (page, kwargs) => {
    const url = await page.evaluate(() => window.location.href);
    if (!url.includes('ditu.amap.com')) {
      await page.goto('https://ditu.amap.com/ssr/faves');
      await page.wait(1.5);
    }

    const { sync3 } = await getAmapLocalStorage(page);
    let routes = parseRoutes(sync3);

    const q = String(kwargs.query || '').trim().toLowerCase();
    const limit = Number(kwargs.limit) || 30;

    if (q) {
      routes = routes.filter(r => 
        (r.route_name && r.route_name.toLowerCase().includes(q)) ||
        (r.start_name && r.start_name.toLowerCase().includes(q)) ||
        (r.end_name && r.end_name.toLowerCase().includes(q))
      );
    }

    return routes.slice(0, limit);
  }
});
