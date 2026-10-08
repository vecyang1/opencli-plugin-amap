import { cli, Strategy } from '@jackwener/opencli/registry';
import { getAmapLocalStorage, parseSpots } from './_shared.js';

export const command = cli({
  site: 'amap',
  name: 'spots',
  access: 'read',
  description: '查询/筛选已收藏的高德地图地点列表，支持按关键词、城市、分类筛选，极速返回',
  example: 'opencli amap spots 阳朔 --city 桂林 -f json\nopencli amap spots --city 大理 --limit 20',
  domain: 'ditu.amap.com',
  strategy: Strategy.COOKIE,
  browser: true,
  navigateBefore: false,
  args: [
    { name: 'query', positional: true, required: false, help: '地点名称、地址或自定义别名关键词' },
    { name: 'city', type: 'str', help: '按城市筛选 (例如: 桂林, 佛山, 大理, 深圳)' },
    { name: 'limit', type: 'int', default: 30, help: '返回数量上限 (默认 30)' }
  ],
  columns: [
    'name',
    'city',
    'address',
    'category',
    'longitude_gcj02',
    'latitude_gcj02',
    'poiid',
    'amap_url'
  ],
  func: async (page, kwargs) => {
    const url = await page.evaluate(() => window.location.href);
    if (!url.includes('ditu.amap.com')) {
      await page.goto('https://ditu.amap.com/ssr/faves');
      await page.wait(1.5);
    }

    const { sync1 } = await getAmapLocalStorage(page);
    let spots = parseSpots(sync1);

    const q = String(kwargs.query || '').trim().toLowerCase();
    const city = String(kwargs.city || '').trim().toLowerCase();
    const limit = Number(kwargs.limit) || 30;

    if (city) {
      spots = spots.filter(s => (s.city && s.city.toLowerCase().includes(city)) || (s.address && s.address.toLowerCase().includes(city)));
    }

    if (q) {
      spots = spots.filter(s => 
        (s.name && s.name.toLowerCase().includes(q)) || 
        (s.custom_name && s.custom_name.toLowerCase().includes(q)) || 
        (s.address && s.address.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.tag && s.tag.toLowerCase().includes(q))
      );
    }

    return spots.slice(0, limit);
  }
});
