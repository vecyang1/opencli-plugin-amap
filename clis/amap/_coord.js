// _coord.js — Amap coordinate conversion algorithms
const R = 2.0 * Math.PI * 6378137.0;
const A = 6378245.0;
const EE = 0.00669342162296594323;

export function pixelToLngLat(x, y, level = 20, precision = 6) {
  const i = R / ((1 << level) * 256.0);
  const o = x * i - R / 2.0;
  let s = Math.PI / 2.0 - 2.0 * Math.atan(Math.exp(-(R / 2.0 - y * i) / 6378137.0));
  s *= 180.0 / Math.PI;
  let c = (o / 6378137.0) * (180.0 / Math.PI);
  if (precision !== null) {
    c = Number(c.toFixed(precision));
    s = Number(s.toFixed(precision));
  }
  return { lng: c, lat: s };
}

function transformLat(x, y) {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0;
  ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320.0 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0;
  return ret;
}

function transformLon(x, y) {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0;
  ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0;
  return ret;
}

export function gcj02ToWgs84(lng, lat, precision = 6) {
  const dlat = transformLat(lng - 105.0, lat - 35.0);
  const dlng = transformLon(lng - 105.0, lat - 35.0);
  const radlat = (lat / 180.0) * Math.PI;
  let magic = Math.sin(radlat);
  magic = 1 - EE * magic * magic;
  const sqrtmagic = Math.sqrt(magic);
  const dlat2 = (dlat * 180.0) / (((A * (1 - EE)) / (magic * sqrtmagic)) * Math.PI);
  const dlng2 = (dlng * 180.0) / ((A / sqrtmagic) * Math.cos(radlat) * Math.PI);
  const mglat = lat + dlat2;
  const mglng = lng + dlng2;
  let wgsLng = lng * 2 - mglng;
  let wgsLat = lat * 2 - mglat;
  if (precision !== null) {
    wgsLng = Number(wgsLng.toFixed(precision));
    wgsLat = Number(wgsLat.toFixed(precision));
  }
  return { lng: wgsLng, lat: wgsLat };
}
