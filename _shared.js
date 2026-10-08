import { pixelToLngLat, gcj02ToWgs84 } from './_coord.js';

export async function getAmapLocalStorage(page) {
  return await page.evaluate(() => {
    // Find cloudsync keys
    const keys = Object.keys(localStorage);
    const sync1Key = keys.find(k => k.startsWith('cloudsync_data_') && k.endsWith('_1X'));
    const sync3Key = keys.find(k => k.startsWith('cloudsync_data_') && k.endsWith('_3X'));
    const userInfoKey = keys.find(k => k.includes('USER_INFO'));

    return {
      sync1: sync1Key ? localStorage.getItem(sync1Key) : null,
      sync3: sync3Key ? localStorage.getItem(sync3Key) : null,
      userInfo: userInfoKey ? localStorage.getItem(userInfoKey) : null
    };
  });
}

export function parseSpots(raw1X) {
  if (!raw1X) return [];
  const parsed = typeof raw1X === 'string' ? JSON.parse(raw1X) : raw1X;
  const items = parsed.items || [];
  
  return items.map((item, idx) => {
    const data = item.data || {};
    const itemId = item.id || data.item_id || String(idx);
    
    let name = data.name || data.custom_name || data.common_name || data.alias || '未命名地点';
    let address = data.address || data.custom_address || '';
    
    let lon = null;
    let lat = null;
    if (data.lon && data.lat) {
      lon = Number(Number(data.lon).toFixed(6));
      lat = Number(Number(data.lat).toFixed(6));
    }
    
    if ((lon === null || lat === null) && data.point_x && data.point_y) {
      const p = pixelToLngLat(Number(data.point_x), Number(data.point_y));
      lon = p.lng;
      lat = p.lat;
    }
    
    if ((lon === null || lat === null) && data.to_poi) {
      const px = Number(data.to_poi.mx || data.end_x);
      const py = Number(data.to_poi.my || data.end_y);
      if (px && py) {
        const p = pixelToLngLat(px, py);
        lon = p.lng;
        lat = p.lat;
        if (!name || name === '未命名地点') name = data.to_poi.mName || data.route_name || name;
        if (!address) address = data.to_poi.mAddr || address;
      }
    }
    
    let wgs = { lng: null, lat: null };
    if (lon !== null && lat !== null) {
      wgs = gcj02ToWgs84(lon, lat);
    }
    
    const poiid = data.poiid || data.mId || '';
    const city = data.cityName || data.city_name || data.cityCode || data.city_code || '';
    const category = data.industry || data.newType || data.new_type || '';
    
    return {
      id: itemId,
      name,
      custom_name: data.custom_name || '',
      city,
      address,
      poiid,
      category,
      tag: data.tag || '',
      longitude_gcj02: lon,
      latitude_gcj02: lat,
      longitude_wgs84: wgs.lng,
      latitude_wgs84: wgs.lat,
      created_at: data.create_time || item.ts || '',
      amap_url: poiid 
        ? `https://ditu.amap.com/ssr/faves/poi_detail?id=${poiid}&source=favorite_list&name=${encodeURIComponent(name)}`
        : `https://ditu.amap.com/ssr/search?query=${encodeURIComponent(name)}`
    };
  });
}

export function parseRoutes(raw3X) {
  if (!raw3X) return [];
  const parsed = typeof raw3X === 'string' ? JSON.parse(raw3X) : raw3X;
  const items = parsed.items || [];
  
  return items.map((item, idx) => {
    const d = item.data || {};
    const startName = d.from_poi_json?.mName || d.start_name || d.name || '起点';
    const endName = d.to_poi_json?.mName || d.end_name || d.route_name || '终点';
    
    let sLon = null, sLat = null, eLon = null, eLat = null;
    const sx = d.from_poi_json?.mX || d.start_x;
    const sy = d.from_poi_json?.mY || d.start_y;
    const ex = d.to_poi_json?.mX || d.end_x;
    const ey = d.to_poi_json?.mY || d.end_y;
    
    if (sx && sy) {
      const p = pixelToLngLat(Number(sx), Number(sy));
      sLon = p.lng;
      sLat = p.lat;
    }
    if (ex && ey) {
      const p = pixelToLngLat(Number(ex), Number(ey));
      eLon = p.lng;
      eLat = p.lat;
    }
    
    const methodMap = { 0: '驾车', 1: '公交/地铁', 2: '步行', 3: '骑行' };
    const methodStr = methodMap[d.method] || (d.method !== undefined ? String(d.method) : '未知');
    
    return {
      id: item.id || String(idx),
      type: item.type,
      route_name: d.route_name || `${startName} → ${endName}`,
      start_name: startName,
      end_name: endName,
      method: methodStr,
      distance_meters: d.mPathlength || d.route_len || '',
      duration_seconds: d.mCostTime || '',
      start_longitude: sLon,
      start_latitude: sLat,
      end_longitude: eLon,
      end_latitude: eLat,
      updated_at: d.update_time || item.ts || ''
    };
  });
}
