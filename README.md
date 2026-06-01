# 东京溜娃地图 Tokyo Kids Map

面向在日华人家庭的东京亲子出行地图 MVP。第一版聚焦地点发现、筛选、地图 Marker 和地点详情，验证家长是否需要一个适合 0-10 岁儿童的中文亲子地图。

## 技术栈

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- MapLibre GL
- OpenStreetMap raster tiles
- Supabase
- Vercel compatible

未使用 Google Maps、Mapbox、Firebase、MongoDB。

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## 环境变量

复制 `.env.example` 为 `.env.local`，填写：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

如果 Supabase 环境变量为空，应用会读取 `src/data/seed.json`。如果环境变量存在，会优先读取 Supabase；当表未创建或请求失败时，自动回退到 JSON seed，方便 MVP 阶段部署和演示。

## Supabase 初始化

在 Supabase SQL Editor 中执行：

```txt
supabase/seed.sql
```

该文件包含：

- `places` 表结构
- `slug`、`ward`、`updated_at`
- 常用索引
- 30 条地点种子数据
- `on conflict` 更新逻辑

## 项目结构

```txt
src/
  app/
    page.tsx
    place/[id]/page.tsx
    robots.ts
    sitemap.ts
  components/
    filters/
    map/
    place/
  data/
    seed.json
    place-options.ts
  lib/
    repositories/
    supabase/
    place-filters.ts
  types/
    place.ts
public/
supabase/
  seed.sql
```

## 数据访问架构

页面不直接访问数据库。统一通过 `PlaceRepository`：

- `JsonPlaceRepository`：读取 `seed.json`
- `SupabasePlaceRepository`：读取 Supabase `places`
- `getPlaceRepository()`：根据环境变量选择数据源，并在失败时回退 JSON

未来从 JSON 切到 Supabase 不需要改页面。

## 已实现功能

- 首页 `/`
- 桌面端左侧筛选 + 右侧地图
- 移动端全屏地图 + 筛选抽屉
- 年龄、分类、特点筛选
- MapLibre GL + OpenStreetMap
- Marker 点击弹窗
- 地点详情页 `/place/[id]`
- 评分星级展示：停车、婴儿车、换尿布、放电指数
- metadata、sitemap、robots

## Vercel 部署

1. 将仓库导入 Vercel
2. Framework 选择 Next.js
3. 添加环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`
4. 执行默认构建命令：

```bash
npm run build
```

## 未来扩展预留

暂不实现，但建议按以下模块扩展：

- 收藏：新增 `favorites` 表，Repository 层新增用户维度查询
- 评论：新增 `reviews` 表，详情页下挂评论组件
- 组队遛娃：新增 `playdates` 表和活动发布页面
- LINE 登录：通过 Supabase Auth OAuth 接入
- AI 遛娃规划师：新增 `src/lib/ai/`，基于地点、天气、年龄做行程建议
- 附近推荐：基于经纬度计算距离，后续可引入 PostGIS
- 天气联动推荐：新增 weather provider，筛选雨天、酷暑、寒冷适配地点
- Marker 聚合：MapLibre GeoJSON source cluster，适配 1000+ 地点

## 注意

种子地点经纬度和说明用于 MVP 验证，正式上线前建议逐条复核营业时间、设施、费用、停车和亲子设施信息。
