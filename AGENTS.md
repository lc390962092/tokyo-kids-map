# AGENTS.md — 東京親子散策マップ

> 本文件記錄工程概要、踩坑經驗、配置說明，供開發者/AI 助手快速上手。

---

## 1. 工程概要

| 項目 | 說明 |
|------|------|
| 名稱 | 東京親子散策マップ |
| 用途 | 東京 23 區親子友善地點（公園、兒童館、遊樂場等）地圖導覽 |
| 數據量 | 131 個地點，涵蓋東京 23 區 |
| 部署 | Vercel（靜態頁面 SSG + 動態地圖） |
| 域名 | Vercel 自動分配（如 `https://xxx.vercel.app`） |

---

## 2. 技術棧

| 層 | 技術 |
|----|------|
| 框架 | Next.js 15.5.18 (App Router) |
| UI | React 19.2.4, TypeScript, Tailwind CSS v4 |
| 地圖 | MapLibre GL JS v5.24.0 |
| 圖標 | Lucide React |
| 數據庫 | Supabase (PostgreSQL + PostGIS) |
| 認證 | Supabase Auth (Email/Password) |
| 靜態數據 | `src/data/seed.json` |

---

## 3. 項目結構

```
src/
  app/                    # Next.js App Router
    page.tsx              # 首頁（地圖）
    layout.tsx            # 根佈局（全局 AuthProvider + TopNav）
    login/page.tsx        # 登入/註冊頁
    admin/page.tsx        # 管理後台（地點 CRUD）
    place/[id]/page.tsx   # 地點詳情頁（SSG）
  components/
    map/kids-map.tsx      # 交互地圖（聚合、定位、彈窗）
    place/                # 詳情頁組件（導航、評論等）
    layout/top-nav.tsx    # 頂部導航（登入狀態、管理入口）
  lib/
    supabase/
      client.ts           # Supabase 客戶端（瀏覽器/SSR 自適應）
      auth-context.tsx    # 全局認證 Context
  data/seed.json          # 131 個地點靜態數據
  types/place.ts          # Place 類型定義
```

---

## 4. 認證與權限

### 4.1 角色系統
- `profiles` 表存儲用戶角色（`user` / `admin`）
- 第一個註冊用戶自動成為 `admin`（通過數據庫 trigger）
- 匿名用戶可以瀏覽地圖、地點詳情、評論，無需登入

### 4.2 RLS 策略
| 表 | SELECT | INSERT | UPDATE | DELETE |
|----|--------|--------|--------|--------|
| `places` | 所有人 | admin | admin | admin |
| `reviews` | 所有人 | 所有人（匿名） | — | — |
| `profiles` | 所有人 | trigger 自動 | — | — |

### 4.3 踩坑記錄
**⚠️ 關鍵：Supabase client 必須區分瀏覽器/服務端**
```ts
// client.ts
return createClient(url, anonKey, {
  auth: {
    persistSession: typeof window !== "undefined",   // 瀏覽器=true, SSR=false
    autoRefreshToken: typeof window !== "undefined",
  },
});
```
如果 `persistSession: false`，瀏覽器中無法保持登入狀態，admin 的 CRUD 請求會因缺少 JWT 而被 RLS 拒絕。

---

## 5. 地圖開發踩坑

### 5.1 MapLibre v5 API 變更
- `getClusterExpansionZoom(clusterId)` 返回 **Promise**（非 callback）
- 數據源加載必須用 `map.once("load")` 包裹，否則報 "Style is not done loading"

### 5.2 Marker 點擊失效
必須顯式綁定 marker DOM 的 click 事件，並 `stopPropagation()`：
```ts
markerElement.addEventListener("click", (e) => {
  e.stopPropagation();
  marker.togglePopup();
});
```

### 5.3 自定義定位按鈕
- 移除原生 `GeolocateControl`（樣式難自定義）
- 用瀏覽器 `navigator.geolocation` API + `map.flyTo()` + 藍色圓點 marker 實現
- **僅 HTTPS / localhost 可用**，IP 內網測試會失敗

### 5.4 SSR 與 `navigator.userAgent`
平台檢測（iOS→Apple Maps, 其他→Google Maps）必須延遲到 `useEffect` 中執行，否則導致 hydration mismatch。

---

## 6. 數據管理

### 6.1 雙數據源
- **Supabase**：運行時動態讀取（地圖、列表、評論）
- **seed.json**：構建時用於 SSG（靜態詳情頁）
- 修改 Supabase 後，地圖即時生效；靜態詳情頁需重新部署才更新

### 6.2 坐標數據維護
- 基礎 30 條記錄為「地面真相」，後續修正應以此為準
- 管理後台支持地址自動解析為經緯度（Nominatim API）

---

## 7. 環境變量

`.env.local`（本地開發）：
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Vercel 生產環境：
- `NEXT_PUBLIC_SITE_URL` 必須改為生產域名（如 `https://xxx.vercel.app`）
- 否則 Supabase 確認郵件中的鏈接會指向 localhost

**⚠️ 安全提醒**：Anon Key 是公開安全的（客戶端可暴露）。Service Role Key 絕對不能寫入客戶端代碼或提交到 Git。

---

## 8. 構建與部署

```bash
npm run build    # ESLint + TypeScript 檢查必須通過
npm run dev      # 本地開發
```

Vercel 自動部署（GitHub 主分支 push 觸發）。

---

## 9. 敏感信息檢查清單

| 檢查項 | 狀態 | 位置 |
|--------|------|------|
| Service Role Key | ✅ 未使用 | 僅在 SQL Editor/Edge Functions 中使用 |
| Anon Key | ✅ 公開安全 | `.env.local` / Vercel 環境變量 |
| 數據庫密碼 | ✅ 未暴露 | 由 Supabase 託管 |
| 用戶密碼 | ✅ 未存儲 | Supabase Auth 哈希存儲 |
| JWT Secret | ✅ 未暴露 | Supabase 後台管理 |

---

## 10. 常見問題

**Q: 刪除 `profiles` 表後還能登入但沒有 admin 權限？**
A: `auth.users` 存登入信息，`profiles` 存角色。刪除後需手動恢復 profile 記錄，或執行 SQL 自動重建。

**Q: 新用戶收不到確認郵件？**
A: 檢查垃圾郵件箱；或在 Supabase Dashboard → Auth → Providers → Email 中關閉 "Confirm email"。

**Q: 確認郵件鏈接指向 localhost？**
A: 將 Supabase Dashboard 的 Site URL 和 Vercel 的 `NEXT_PUBLIC_SITE_URL` 都改為生產域名。
