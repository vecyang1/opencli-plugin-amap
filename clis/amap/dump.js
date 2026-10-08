import { cli, Strategy } from '@jackwener/opencli/registry';
import { getAmapLocalStorage, parseSpots, parseRoutes } from './_shared.js';
import fs from 'node:fs/promises';
import path from 'node:path';

export const command = cli({
  site: 'amap',
  name: 'dump',
  access: 'read',
  description: '全量导出高德地图收藏地点 (856+地点) 及收藏路线 (195+路线)，支持自动坐标解密转换 (WGS-84/GCJ-02)',
  example: 'opencli amap dump -f json\nopencli amap dump --out ./my_amap_backup',
  domain: 'ditu.amap.com',
  strategy: Strategy.COOKIE,
  browser: true,
  navigateBefore: false,
  args: [
    { name: 'out', type: 'str', help: '导出目录路径 (默认写入 stdout 或指定目录导出 json/geojson/csv)' }
  ],
  columns: [
    'type',
    'total_count',
    'coords_count',
    'sample_name',
    'sample_city',
    'status'
  ],
  func: async (page, kwargs) => {
    // Ensure we are on ditu.amap.com
    const url = await page.evaluate(() => window.location.href);
    if (!url.includes('ditu.amap.com')) {
      await page.goto('https://ditu.amap.com/ssr/faves');
      await page.wait(2);
    }

    const { sync1, sync3, userInfo } = await getAmapLocalStorage(page);
    const spots = parseSpots(sync1);
    const routes = parseRoutes(sync3);
    const user = userInfo ? JSON.parse(userInfo) : null;

    if (kwargs.out) {
      const outDir = path.resolve(process.cwd(), kwargs.out);
      await fs.mkdir(outDir, { recursive: true });

      // Save spots json
      await fs.writeFile(path.join(outDir, 'amap_spots.json'), JSON.stringify(spots, null, 2), 'utf-8');

      // Save spots geojson
      const features = spots.filter(s => s.longitude_gcj02 && s.latitude_gcj02).map(s => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.longitude_gcj02, s.latitude_gcj02] },
        properties: s
      }));
      await fs.writeFile(path.join(outDir, 'amap_spots.geojson'), JSON.stringify({ type: 'FeatureCollection', features }, null, 2), 'utf-8');

      // Save spots wgs84 geojson
      const featuresWgs = spots.filter(s => s.longitude_wgs84 && s.latitude_wgs84).map(s => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.longitude_wgs84, s.latitude_wgs84] },
        properties: s
      }));
      await fs.writeFile(path.join(outDir, 'amap_spots_wgs84.geojson'), JSON.stringify({ type: 'FeatureCollection', features: featuresWgs }, null, 2), 'utf-8');

      // Save routes json
      await fs.writeFile(path.join(outDir, 'amap_routes.json'), JSON.stringify(routes, null, 2), 'utf-8');

      return [
        {
          type: 'spots',
          total_count: spots.length,
          coords_count: features.length,
          sample_name: spots[0]?.name,
          sample_city: spots[0]?.city,
          status: `已写入文件: ${path.join(outDir, 'amap_spots.json')}`
        },
        {
          type: 'routes',
          total_count: routes.length,
          coords_count: routes.filter(r => r.start_longitude && r.end_longitude).length,
          sample_name: routes[0]?.route_name,
          sample_city: user?.nickname || '未知用户',
          status: `已写入文件: ${path.join(outDir, 'amap_routes.json')}`
        }
      ];
    }

    return [
      {
        type: 'spots',
        total_count: spots.length,
        coords_count: spots.filter(s => s.longitude_gcj02).length,
        sample_name: spots[0]?.name,
        sample_city: spots[0]?.city,
        status: 'ok'
      },
      {
        type: 'routes',
        total_count: routes.length,
        coords_count: routes.filter(r => r.start_longitude && r.end_longitude).length,
        sample_name: routes[0]?.route_name,
        sample_city: user?.nickname || '未知用户',
        status: 'ok'
      }
    ];
  }
});
