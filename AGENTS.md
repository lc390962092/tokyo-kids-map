# AGENTS.md — 東京親子散策マップ

> 本文件記錄工程概要、踩坑經驗、配置說明，供開發者/AI 助手快速上手。
> **最後更新**：2026-06-02（新增約伴系統、會員中心、管理後台優化）

---

## 1. 工程概要

| 項目 | 說明 |
|------|------|
| 名稱 | 東京親子散策マップ |
| 用途 | 東京 23 區親子友善地點（公園、兒童館、遊樂場等）地圖導覽 |
| 數據量 | 131 個地點，涵蓋東京 23 區 |
| 會員功能 | 郵箱註冊/登入、管理後台（admin）、會員中心、約伴系統 |
| 部署 | Vercel（靜態頁面 SSG + 動態地圖） |
| 域名 | Vercel 自動分配（如 `https://xxx.vercel.app`） |

### 主要功能模塊
- **地圖瀏覽**：131 個地點，分類篩選、聚合標記、定位、彈窗
- **地點詳情**：SSG 靜態頁面，評論、導航、評分
- **管理後台**（`/admin`）：地點 CRUD，支持 Google Maps 鏈接自動解析坐標
- **會員中心**（`/member`）：我發起的約伴、我報名的約伴
- **約伴系統**（Playdate）：地圖上顯示附近 3km 內的溜娃邀約，登錄後可發起/報名，過期自動隱藏

---

## 2. 技術棧

| 層 | 技術 |
|----|------|
| 框架 | Next.js 15.5.18 (App Router) |
| UI | React 19.2.4, TypeScript, Tailwind CSS v4 |
| 地圖 | MapLibre GL JS v5.24.0 |
| 圖標 | Lucide React |
| 數據庫 | Supabase (PostgreSQL) |
| 認證 | Supabase Auth (Email/Password) |
| 地理計算 | Haversine 公式（無需 PostGIS） |
| 靜態數據 | `src/data/seed.json` |

---

## 3. 項目結構

```
src/
  app/                    # Next.js App Router
    page.tsx              # 首頁（地圖 + 約伴標記）
    layout.tsx            # 根佈局（全局 AuthProvider + TopNav）
    login/page.tsx        # 登入/註冊頁
    admin/page.tsx        # 管理後台（地點 CRUD）
    member/page.tsx       # 會員中心（我的約伴）
    place/[id]/page.tsx   # 地點詳情頁（SSG）
  components/
    map/                  # 地圖相關組件
    playdate/             # 約伴系統組件
      playdate-marker.tsx     # 脈衝動畫標記
      playdate-layer.tsx      # 地圖圖層管理
      playdate-form-modal.tsx # 發起約伴彈窗
      playdate-detail-modal.tsx # 詳情/報名彈窗
    place/                # 詳情頁組件
    layout/top-nav.tsx    # 頂部導航
  lib/
    supabase/             # Supabase 客戶端 & Auth
    playdates.ts          # 約伴 API 函數
    repositories/         # 數據倉庫
  data/seed.json          # 131 個地點靜態數據
  types/
    place.ts
    playdate.ts
```

---

## 4. 認證與權限

### 4.1 角色系統
- `profiles` 表存儲用戶角色（`user` / `admin`）
- 第一個註冊用戶自動成為 `admin`（通過數據庫 trigger）
- 匿名用戶可以瀏覽地圖、地點詳情、評論、查看約伴，無需登入
- **約伴系統**：必須登入才能發起/報名

### 4.2 RLS 策略
| 表 | SELECT | INSERT | UPDATE | DELETE |
|----|--------|--------|--------|--------|
| `places` | 所有人 | admin | admin/admin | admin/admin |
| `reviews` | 所有人 | 所有人（匿名） | — | — |
| `profiles` | 所有人 | trigger 自動 | — | — |
| `playdates` | 所有人（僅 active + 未過期） | 登錄用戶（必須是自己） | 發起人/admin | 發起人/admin |
| `playdate_responses` | 所有人 | 登錄用戶（必須是自己） | 自己 | 自己 |

### 4.3 踩坑記錄
**⚠️ 關鍵 1：Supabase client 必須區分瀏覽器/服務端**
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

**⚠️ 關鍵 2：Supabase 插入時 UUID 必須自己生成**
如果表的主鍵沒有設置 `DEFAULT gen_random_uuid()`，insert 時必須在客戶端生成 UUID：
```ts
payload.id = crypto.randomUUID();
await supabase.from("places").insert(payload);
```
否則會報錯：`null value in column "id" violates not-null constraint`。

**⚠️ 關鍵 3：RLS INSERT 策略必須與 payload 匹配**
`WITH CHECK (auth.uid() = user_id)` 要求 payload 中必須包含 `user_id` 且等於當前登入用戶。如果忘記在 payload 中帶 `user_id`，insert 會靜默失敗或被拒絕。

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

### 5.5 疊加自定義圖層（約伴標記）
將自定義圖層組件作為 Map 組件的子元素傳入，在 `mapRef.current` 存在後渲染：
```tsx
{mapRef.current && showPlaydates && (
  <PlaydateLayer map={mapRef.current} visible={showPlaydates} onSelect={...} />
)}
```
圖層內部負責 marker 創建/銷毀、事件監聽、`moveend` 重新加載附近數據。

---

## 6. 約伴系統設計

### 6.1 數據表
- `playdates`：存儲邀約信息（標題、時間、坐標、範圍、人數、狀態）
- `playdate_responses`：存儲報名信息（用戶、留言、狀態）

### 6.2 附近搜索
使用 Haversine 公式計算球面距離，無需 PostGIS：
```sql
6371000 * acos(
  LEAST(1.0, GREATEST(-1.0,
    cos(radians(lat)) * cos(radians(p.latitude)) *
    cos(radians(p.longitude) - radians(lon)) +
    sin(radians(lat)) * sin(radians(p.latitude))
  ))
) <= radius_meters
```

### 6.3 時效性
- 只顯示 `status = 'active'` 且 `meet_at > now()` 的邀約
- 過期邀約自動從地圖和列表中消失
- 發起人可手動「取消邀約」

### 6.4 權限
- 匿名用戶：僅查看
- 登錄用戶：發起、報名、取消自己的報名
- 發起人：編輯、取消自己的邀約
- admin：可管理所有邀約

---

## 7. 管理後台與坐標維護

### 7.1 坐標輸入方式
管理後台提供三種方式獲取坐標：
1. **Nominatim 自動解析**（地址 → 經緯度，日本地址可能不準）
2. **Google Maps 搜索按鈕**：點擊在新標籤頁打開 Google Maps，右鍵複製坐標
3. **粘貼 Google Maps 鏈接**：自動解析 `@lat,lng` 或 `?q=lat,lng` 格式

### 7.2 頂部導航重疊問題
- 首頁/admin 移動端：TopNav 隱藏，登錄/管理/退出按鈕整合到頂部工具欄
- admin 桌面端：給 `main` 加 `pt-14`，避免 TopNav 蓋住標題和搜索框
- 關鍵教訓：**fixed 定位的導航必須給頁面內容預留足夠的頂部 padding**

---

## 8. 數據管理

### 8.1 雙數據源
- **Supabase**：運行時動態讀取（地圖、列表、評論、約伴）
- **seed.json**：構建時用於 SSG（靜態詳情頁）
- 修改 Supabase 後，地圖即時生效；靜態詳情頁需重新部署才更新

### 8.2 坐標數據維護
- 基礎 30 條記錄為「地面真相」，後續修正應以此為準
- 管理後台支持地址自動解析為經緯度

---

## 9. 環境變量

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

## 10. 構建與部署

```bash
npm run build    # ESLint + TypeScript 檢查必須通過
npm run dev      # 本地開發
```

Vercel 自動部署（GitHub 主分支 push 觸發）。

---

## 11. 敏感信息檢查清單

| 檢查項 | 狀態 | 位置 |
|--------|------|------|
| Service Role Key | ✅ 未使用 | 僅在 SQL Editor/Edge Functions 中使用 |
| Anon Key | ✅ 公開安全 | `.env.local` / Vercel 環境變量 |
| 數據庫密碼 | ✅ 未暴露 | 由 Supabase 託管 |
| 用戶密碼 | ✅ 未存儲 | Supabase Auth 哈希存儲 |
| JWT Secret | ✅ 未暴露 | Supabase 後台管理 |
| 微信/第三方密鑰 | ✅ 未使用 | 未接入微信登錄 |

---

## 12. 常見問題

**Q: 刪除 `profiles` 表後還能登入但沒有 admin 權限？**
A: `auth.users` 存登入信息，`profiles` 存角色。刪除後需手動恢復 profile 記錄，或執行 SQL 自動重建。

**Q: 新用戶收不到確認郵件？**
A: 檢查垃圾郵件箱；或在 Supabase Dashboard → Auth → Providers → Email 中關閉 "Confirm email"。

**Q: 確認郵件鏈接指向 localhost？**
A: 將 Supabase Dashboard 的 Site URL 和 Vercel 的 `NEXT_PUBLIC_SITE_URL` 都改為生產域名。

**Q: 新增地點報錯 "null value in column id"？**
A: 確認 `places.id` 有 `DEFAULT gen_random_uuid()`，或代碼已在客戶端生成 UUID（`crypto.randomUUID()`）。

**Q: 約伴標記沒有出現在地圖上？**
A: 確認已在 Supabase 執行 `supabase/setup_playdates.sql`，且當前地圖中心 3km 內有未過期的 active 邀約。

**Q: 發起約伴提示權限不足？**
A: 檢查 RLS policy：`playdates` 的 INSERT 策略要求 `auth.uid() = user_id`，且 payload 中必須帶 `user_id`。

---

## 13. 待探索/擴展方向

- **微信登錄**：需要企業營業執照 + ICP 備案域名，當前未接入
- **實時通知**：可用 Supabase Realtime 監聽 `playdate_responses` 表
- **私信/聊天**：約伴成功後的溝通渠道
- **圖片上傳**：地點/約伴封面圖使用 Supabase Storage
