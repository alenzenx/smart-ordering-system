# 智慧點餐系統

這是一套可在本機直接以 Docker 啟動的智慧點餐系統，包含：

- 顧客端點餐網站
- 後台管理網站
- Django API
- MySQL 資料庫
- phpMyAdmin 圖形管理介面
- Gemini 點餐助理

## 特色

- 零設定可啟動：不需要先建立 `.env`
- 前後台分離：顧客端與後台是兩個不同網頁
- 後台可管理菜單 CRUD
- 顧客可加入購物車、清空購物車、送出訂單
- 後台可查看與刪除訂單
- 支援 Excel 覆蓋匯入菜單
- 匯入菜單時會一併清空舊訂單
- Gemini 助理可幫忙加菜、刪菜、改數量

## 技術組成

- React
- Django
- MySQL 8.4
- phpMyAdmin
- Docker Compose
- Gemini CLI

## 系統架構

- `admin-frontend`
  - 後台管理系統
  - 入口網址：`http://localhost:5173`
- `customer-frontend`
  - 顧客點餐系統
  - 入口網址：`http://localhost:5174`
- `backend`
  - Django API
  - 入口網址：`http://localhost:8000`
- `db`
  - MySQL
  - 連接埠：`3306`
- `phpmyadmin`
  - MySQL 圖形介面
  - 入口網址：`http://localhost:8080`

## 零設定啟動

本專案目前已調整成不需要 `.env` 也能直接啟動。

在專案根目錄執行：

```powershell
docker compose up --build -d
```

啟動完成後可直接開啟：

- 後台管理系統：[http://localhost:5173](http://localhost:5173)
- 顧客點餐系統：[http://localhost:5174](http://localhost:5174)
- Django API：[http://localhost:8000](http://localhost:8000)
- phpMyAdmin：[http://localhost:8080](http://localhost:8080)

查看服務狀態：

```powershell
docker compose ps
```

關閉服務：

```powershell
docker compose down
```

## `.env` 與 `.env.example`

### 是否一定需要 `.env`

不需要。

目前 `docker-compose.yml` 已經內建預設值，所以專案可以直接啟動。

### `.env.example` 的用途

`.env.example` 只用來提供「可選的覆寫設定」，例如：

```env
GEMINI_CLI_COMMAND=gemini
GEMINI_CLI_MODEL=gemini-2.5-flash
```

如果你想自行改 Gemini CLI 指令或模型，可以再把 `.env.example` 複製成 `.env`。

## Gemini 助理行為

### 預設模式

顧客端右側有常駐的 `Gemini 點餐助理`。

它可以：

- 推薦菜品
- 說明價格
- 說明過敏原
- 加入購物車
- 修改數量
- 刪除品項
- 清空購物車

它不會：

- 直接替你送出訂單

### 零設定下怎麼運作

本專案支援兩種模式：

1. `Gemini CLI 可用`
   - 後端會呼叫 Gemini CLI 產生回覆
2. `Gemini CLI 尚未登入或不可用`
   - 系統會自動退回本地規則模式
   - 仍可正常處理基本加菜、刪菜、改數量、推薦與查詢

也就是說：

- 沒有 `.env` 也能跑
- 沒有登入 Gemini CLI 也不會讓整個系統壞掉
- 只是助理會退回較簡單的本地規則回覆

### 如果你想啟用真正的 Gemini CLI

在 Windows 主機上先完成 Gemini CLI 登入，並讓以下資料夾存在：

```text
%USERPROFILE%\.gemini
```

Docker 會將它掛載到 backend container 的：

```text
/root/.gemini
```

如果登入成功，助理就會優先使用 Gemini CLI。

## 顧客端使用流程

1. 開啟 [http://localhost:5174](http://localhost:5174)
2. 從菜單選擇品項
3. 用 `+` / `-` 調整數量
4. 或直接透過右側 Gemini 助理輸入，例如：
   - `幫我加兩份蔥香牛肉捲餅`
   - `把剛剛那個刪掉`
   - `推薦一個飯類`
   - `蜜桃冷泡茶多少錢`
5. 確認右側購物車
6. 可按：
   - `清空購物車`
   - `送出訂單`

## 後台使用流程

1. 開啟 [http://localhost:5173](http://localhost:5173)
2. 進行菜單 CRUD
3. 查看顧客送出的訂單
4. 刪除訂單
5. 需要大量更新時可用 Excel 匯入菜單

## Excel 匯入規則

### 上傳格式

後台可上傳 `.xlsx` 檔案，格式需符合 `test.xlsx`：

```text
菜品名稱 | 菜品價格 | 過敏原 | 菜品介紹
```

### 匯入後會發生什麼

匯入時系統會：

- 清空 `menu_orderitem`
- 清空 `menu_order`
- 清空 `menu_menuitem`
- 重新建立整份菜單

### 重要影響

- 匯入格式本身不包含 `菜品 ID`
- `菜品 ID` 由資料庫重新產生
- 每次重新匯入後，新的菜單 ID 可能和上一版不同

## 菜單與聊天同步機制

為了避免後台匯入新菜單後，顧客端仍保留舊的菜單 ID，前台已加入同步保護：

- 每 5 秒檢查一次菜單是否更新
- 送出聊天前會先同步一次菜單
- 如果助理回傳的 `menu_item_id` 不在前台目前菜單中，前台會立即重新抓菜單再套用

當前台偵測到菜單已變更時，會自動：

- 清空購物車
- 重置助理對話

## API 一覽

### 菜單 API

```text
GET    /api/menu-items/
POST   /api/menu-items/
POST   /api/menu-items/import-xlsx/
GET    /api/menu-items/<id>/
PUT    /api/menu-items/<id>/
DELETE /api/menu-items/<id>/
```

新增或修改菜單範例：

```json
{
  "name": "蒜香牛排奶油炒飯",
  "description": "奶油香氣包覆粒粒分明白飯，搭配牛排與蒜香拌炒。",
  "price": "220.00",
  "allergens": "奶類"
}
```

### 訂單 API

```text
GET    /api/orders/
POST   /api/orders/
GET    /api/orders/<id>/
DELETE /api/orders/<id>/
```

建立訂單範例：

```json
{
  "items": [
    {
      "menu_item_id": 1,
      "quantity": 2
    },
    {
      "menu_item_id": 3,
      "quantity": 1
    }
  ]
}
```

### 聊天 API

```text
POST /api/chat/
```

請求範例：

```json
{
  "messages": [
    {
      "role": "user",
      "content": "幫我加兩份蔥香牛肉捲餅"
    }
  ],
  "cart": [
    {
      "menu_item_id": 1,
      "quantity": 1
    }
  ]
}
```

回應範例：

```json
{
  "reply": "已將指定品項更新為 2 份。",
  "actions": [
    {
      "type": "set_quantity",
      "menu_item_id": 1,
      "quantity": 2
    }
  ],
  "model": "gemini-2.5-flash"
}
```

說明：

- `menu_item_id` 會依照目前資料庫菜單而定
- 如果菜單重新匯入，ID 可能改變

## MySQL 連線資訊

- Host：`localhost`
- Port：`3306`
- Database：`smart_ordering`
- User：`smart_user`
- Password：`smart_pass`
- Root Password：`root_pass`

## phpMyAdmin

網址：

- [http://localhost:8080](http://localhost:8080)

## 主要資料表

- `menu_menuitem`
- `menu_order`
- `menu_orderitem`

額外 SQL 範例可參考：

- [docs/mysql-crud-examples.sql](C:/Users/Alen/Documents/New%20project/docs/mysql-crud-examples.sql)

## 常用 Docker 指令

全部重建並啟動：

```powershell
docker compose up --build -d
```

重新啟動全部服務：

```powershell
docker compose up -d --force-recreate
```

只重建後端：

```powershell
docker compose up --build -d backend
```

只重建顧客前端：

```powershell
docker compose up --build -d customer-frontend
```

查看後端 log：

```powershell
docker compose logs backend --tail 100
```

關閉全部服務：

```powershell
docker compose down
```

## 常見問題

### 1. 拉下 repo 後為什麼沒有 `.env`

這是正常的。

`.env` 沒有被提交到 GitHub，但目前專案已經不需要 `.env` 才能啟動。

### 2. Gemini 助理回覆了，但購物車沒更新

請先確認：

- 顧客端是否已刷新到最新版本
- 後台是否剛重新匯入菜單

目前前台已加入菜單同步保護，若仍遇到問題，重新整理顧客頁面後再試一次。

### 3. 為什麼 Excel 匯入後舊訂單會消失

這是目前設計規格。

因為匯入會重建菜單 ID，如果保留舊訂單，會很容易對到不存在的舊菜單資料。

### 4. 沒登入 Gemini CLI 能不能用

可以。

系統仍可正常啟動，且聊天會退回本地規則模式。

### 5. 如何查看資料庫

可直接開：

- [http://localhost:8080](http://localhost:8080)

或使用你自己的 MySQL Client 連到：

- `localhost:3306`

## 專案目錄

```text
.
├─ admin-frontend
├─ customer-frontend
├─ backend
├─ docs
├─ scripts
├─ docker-compose.yml
├─ .env.example
└─ README.md
```

## 備註

- backend 啟動時會先等待 MySQL 可連線，再自動執行 migration
- 顧客端與後台是兩個獨立 React 網頁
- 這是本機開發與展示版本，不是正式 production 部署配置
