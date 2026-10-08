import test from 'node:test';
import assert from 'node:assert/strict';
import { pixelToLngLat, gcj02ToWgs84 } from '../clis/amap/_coord.js';

test('pixelToLngLat converts AutoNavi G20 pixel coordinates accurately', () => {
  // Test sample: point_x=216622733, point_y=115133022 -> (110.513724, 24.783503)
  const result = pixelToLngLat(216622733, 115133022);
  assert.equal(result.lng, 110.513724);
  assert.equal(result.lat, 24.783503);
});

test('gcj02ToWgs84 converts China Mars coordinates to international WGS-84 GPS coordinates', () => {
  // Tiananmen Square benchmark: GCJ-02 (116.397451, 39.909187) -> WGS-84 (~116.391207, ~39.907783)
  const wgs = gcj02ToWgs84(116.397451, 39.909187);
  assert.equal(wgs.lng, 116.391207);
  assert.equal(wgs.lat, 39.907783);
});

test('gcj02ToWgs84 preserves international GPS coordinates outside China', () => {
  // Warsaw, Poland: (21.122259, 52.232231)
  const warsaw = gcj02ToWgs84(21.122259, 52.232231);
  assert.equal(warsaw.lng, 21.122259);
  assert.equal(warsaw.lat, 52.232231);
});

