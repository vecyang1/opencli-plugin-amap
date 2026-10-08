# opencli-plugin-amap

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![OpenCLI Plugin](https://img.shields.io/badge/OpenCLI-Plugin-purple.svg)](https://github.com/jackwener/OpenCLI)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.18-brightgreen.svg)](https://nodejs.org)

> **AutoNavi / 高德地图 (ditu.amap.com) Agent-Native CLI suite for [OpenCLI](https://github.com/jackwener/OpenCLI).**  
> High-speed local-first extraction for collected spots & routes, sub-meter Web Mercator coordinate decoders (GCJ-02 & WGS-84), and programmatic SSR search.

---

## 🌟 Highlights / 核心亮点

- **⚡ Local-First Zero-Friction Extraction (极速客户端解构)**:  
  Directly accesses Amap Web client storage (`CloudSyncLocalManager`), eliminating brittle page-by-page scraping and bypassing Alibaba's WAF / sliding captcha (`Baxia`) triggers entirely.
- **🛰️ Sub-meter Coordinate Decoders (高精度双坐标还原)**:  
  Decodes AutoNavi's internal 20-bit Web Mercator projection (`pixelToLngLat`), accurately restoring GCJ-02 coordinates and deriving international WGS-84 GPS coordinates (sub-meter accuracy).
- **📦 Multi-Format Exports (全格式导出支持)**:  
  Export all spots and navigation routes into structured `JSON`, standard RFC 7946 `GeoJSON` (ready for Apple Maps / Google Earth / QGIS / Mapbox), and UTF-8 BOM `CSV` (for Excel & Google Sheets).
- **🔍 Agentic SSR Search (程序化搜索引擎接入)**:  
  Programmatically executes queries on `ditu.amap.com/ssr/search`, automatically parses structured `.poi-card` DOM elements, and returns clean JSON without manual clicks.
- **🛡️ 100% Privacy & Local-Only (隐私安全)**:  
  All extraction operates locally within your own browser session lease. Zero data is sent to external servers.

---

## 📦 Installation / 安装

Install as an OpenCLI community plugin via git:

```bash
opencli plugin install github:vecyang1/opencli-plugin-amap
```

Verify installation:

```bash
opencli validate amap
# Output: opencli validate: PASS (Checked 4 commands)
```

---

## 🚀 Commands / 命令指南

### 1. `dump` — 导出全量地点与路线档案

Extracts all saved spots and navigation routes from the active browser session:

```bash
# Print summary table
opencli amap dump

# Export full datasets (JSON, GeoJSON, CSV) to a folder
opencli amap dump --out ./amap_backup
```

Generated files:
- `amap_spots.json`: Detailed spot objects with dual coordinates and direct URLs.
- `amap_spots.geojson`: RFC 7946 GeoJSON in GCJ-02.
- `amap_spots_wgs84.geojson`: RFC 7946 GeoJSON in standard WGS-84.
- `amap_routes.json`: Navigation history and route records.

---

### 2. `spots` — 快速筛选已收藏地点

Instantly queries and filters your collected spots without making external network requests:

```bash
# Search by keyword (name, address, or tag)
opencli amap spots "阳朔" -f json --limit 10

# Filter by city
opencli amap spots "咖啡" --city "大理" -f json

# Tabular output
opencli amap spots --city "深圳" --limit 20
```

---

### 3. `routes` — 查看收藏路线与导航记录

Lists collected routes and navigation history:

```bash
# Search routes
opencli amap routes "深圳" -f json

# Table view
opencli amap routes --limit 15
```

---

### 4. `search` — 程序化 POI 检索

Directly queries Amap's Next.js SSR search engine (`ditu.amap.com/ssr/search`):

```bash
opencli amap search "深圳北站" -f json --limit 5
opencli amap search "阳朔遇龙河" -f table
```

Output fields:
- `title`: POI name
- `address`: Full address
- `tags`: Subways, entrances, ratings
- `image`: Thumbnail photo URL
- `search_url`: Direct search page link

---

## 🔬 Coordinate System Details / 坐标转换说明

AutoNavi internally stores coordinates as 20-bit Mercator pixel values (`point_x`, `point_y`). This plugin incorporates the native conversion formula:

$$\text{lng} = \frac{x \cdot i - R/2}{6378137} \times \frac{180}{\pi}$$
$$\text{lat} = \left(\frac{\pi}{2} - 2 \arctan\left(\exp\left(-\frac{R/2 - y \cdot i}{6378137}\right)\right)\right) \times \frac{180}{\pi}$$

where $R = 2\pi \times 6378137$ and $i = \frac{R}{2^{20} \times 256}$.

It also applies standard non-linear obfuscation offset removal to generate pure WGS-84 coordinates for global GIS compatibility.

---

## 🧪 Testing

Run built-in unit tests:

```bash
npm test
```

---

## 📄 License

MIT License. Copyright (c) 2026 Vec Yang.
