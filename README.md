# 智慧點餐系統

本專案是一套可在本機以 Docker 啟動的智慧點餐系統，包含兩個不同的網頁：

- 顧客端點餐系統
- 後台管理系統

技術組成：

- React 前端
- Django 後端 API
- MySQL 資料庫
- phpMyAdmin 資料庫圖形介面
- Gemini CLI 點餐助理
- Docker Compose 一鍵啟動

## 功能總覽

### 顧客端

- 瀏覽菜單
- 加入購物車、調整數量、清空購物車
- 送出訂單並即時計算總金額
- 右側常駐 `Gemini 點餐助理`
- Gemini 可協助加菜、刪菜、改數量，但不會直接代替顧客送單

### 後台管理系統

- 菜單 CRUD
- 訂單列表顯示
- 訂單刪除
- 匯入 `.xlsx` 菜單
- 匯入時會覆蓋所有舊菜單
- 匯入時會一併清空所有舊訂單與訂單明細

## 系統架構

- `admin-frontend`
  - 後台管理系統
  - 預設網址: `http://localhost:5173`
- `customer-frontend`
  - 顧客點餐系統
  - 預設網址: `http://localhost:5174`
- `backend`
  - Django API
  - 預設網址: `http://localhost:8000`
- `db`
  - MySQL 8.4
  - 預設連接埠: `3306`
- `phpmyadmin`
  - MySQL 圖形管理介面
  - 預設網址: `http://localhost:8080`

## 啟動前需求

### 1. 安裝 Docker Desktop

本專案以 Docker Compose 啟動，請先在 Windows 安裝 Docker Desktop 並確認可正常執行。

### 2. 準備 Gemini CLI 授權

本專案的點餐助理不是直接呼叫 API key，而是由後端容器透過 Gemini CLI 執行。

Docker 會將你 Windows 使用者目錄下的：

```text
%USERPROFILE%\.gemini
```

掛載到 container 內的：

```text
/root/.gemini
```

因此你需要先在 Windows 主機上完成 Gemini CLI 登入，讓 `%USERPROFILE%\.gemini` 內有授權資料。

如果你使用的是一般個人 OAuth 登入，常見授權檔案會包含：

- `%USERPROFILE%\.gemini\oauth_creds.json`
- `%USERPROFILE%\.gemini\settings.json`

`settings.json` 需要是合法 JSON，且不能帶 UTF-8 BOM。

本專案目前使用的 CLI 模型設定在：

```env
GEMINI_CLI_MODEL=gemini-2.5-flash
```

## 環境變數

請參考 [.env.example](C:/Users/Alen/Documents/New%20project/.env.example)。

目前需要的變數只有：

```env
GEMINI_CLI_COMMAND=gemini
GEMINI_CLI_MODEL=gemini-2.5-flash
```

如果你已經有 `.env`，通常不用再修改。

## 啟動方式

在專案根目錄執行：

```powershell
docker compose up --build -d
```

如果只是重新啟動全部服務：

```powershell
docker compose up -d --force-recreate
```

查看服務狀態：

```powershell
docker compose ps
```

## 啟動後網址

- 後台管理系統: [http://localhost:5173](http://localhost:5173)
- 顧客點餐系統: [http://localhost:5174](http://localhost:5174)
- Django API: [http://localhost:8000](http://localhost:8000)
- phpMyAdmin: [http://localhost:8080](http://localhost:8080)

## MySQL 與 phpMyAdmin

### MySQL 連線資訊

- Host: `localhost`
- Port: `3306`
- Database: `smart_ordering`
- User: `smart_user`
- Password: `smart_pass`
- Root Password: `root_pass`

### phpMyAdmin

網址：

- [http://localhost:8080](http://localhost:8080)

目前 compose 已配置成直接連到容器內的 MySQL。

## 使用流程

### 顧客端點餐

1. 開啟 [http://localhost:5174](http://localhost:5174)
2. 從菜單選擇品項
3. 使用 `+`、`-` 調整數量
4. 也可以透過右側 `Gemini 點餐助理` 直接輸入自然語句，例如：
   - `幫我加兩杯蜜桃冷泡茶`
   - `把剛剛那個刪掉`
   - `推薦一個飯類`
5. 確認購物車內容
6. 按 `送出訂單`

### 顧客端購物車功能

- `送出訂單`
  - 送出目前購物車內容到後端
- `清空購物車`
  - 直接清空前台購物車

### 後台管理

1. 開啟 [http://localhost:5173](http://localhost:5173)
2. 管理菜單
3. 查看訂單
4. 刪除訂單
5. 需要大量更新菜單時，使用 Excel 匯入

## Excel 匯入說明

### 匯入入口

後台管理系統中有 Excel 匯入按鈕，可上傳 `.xlsx` 檔案。

### 匯入格式

匯入檔案格式必須符合 `test.xlsx` 的欄位順序。

欄位如下：

```text
菜品名稱 | 菜品價格 | 過敏原 | 菜品介紹
```

注意：

- 匯入格式沒有包含 `菜品 ID`
- `菜品 ID` 由資料庫重新建立
- 匯入時會覆蓋整份菜單
- 匯入時會清空舊訂單與訂單明細
- 每次重新匯入後，菜單的 ID 可能會與上一版不同

### 匯入流程

1. 在後台按 Excel 匯入
2. 選擇符合 `test.xlsx` 格式的 `.xlsx`
3. 送出後，系統會：
   - 清空 `menu_orderitem`
   - 清空 `menu_order`
   - 清空 `menu_menuitem`
   - 重新寫入新的菜單資料

## Gemini 點餐助理說明

### 助理目前行為

Gemini 助理可以：

- 根據菜單推薦品項
- 說明價格
- 說明過敏原
- 幫忙加到購物車
- 幫忙修改數量
- 幫忙刪除品項
- 幫忙清空購物車

Gemini 助理不會：

- 直接幫你送出訂單
- 在沒有菜單資料的情況下亂湊品項

### 助理運作方式

目前後端 `POST /api/chat/` 只保留 Gemini CLI 路徑，不再走 API key 備援。

實作位置：

- [backend/menu/views.py](C:/Users/Alen/Documents/New%20project/backend/menu/views.py)

### 菜單同步防呆

為了避免後台匯入新菜單後，顧客端仍保留舊 ID 與舊對話上下文，前台已加入兩層保護：

- 每 5 秒自動同步一次最新菜單
- 聊天送出前先同步菜單一次
- 如果 Gemini 回傳的 `menu_item_id` 不在前台目前菜單中，前台會立刻重新抓最新菜單再套用

若偵測到菜單已變更，顧客端會：

- 清空購物車
- 重置 Gemini 對話

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

新增或修改菜單的 JSON 範例：

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

建立訂單 JSON 範例：

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
      "content": "幫我加兩杯蜜桃冷泡茶"
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

- `menu_item_id` 會依照目前資料庫中的菜單決定
- 如果你重新匯入 Excel，這些 ID 可能改變

## 資料表

本專案主要會用到以下三張表：

- `menu_menuitem`
- `menu_order`
- `menu_orderitem`

另外可參考：

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

查看所有服務狀態：

```powershell
docker compose ps
```

## 常見問題

### 1. 顧客端聊天有回覆，但購物車沒更新

先確認：

- 顧客端頁面是否已刷新到最新版本
- 後台是否剛匯入新菜單

本專案已加入菜單同步機制，但如果你在非常短時間內連續大量覆蓋菜單，建議直接重新整理顧客頁面再測一次。

### 2. Gemini CLI 回傳授權錯誤

請檢查 `%USERPROFILE%\.gemini` 是否存在，且裡面有有效授權資料。

重點：

- `settings.json` 必須是合法 JSON
- `settings.json` 不可帶 BOM
- Docker backend 需要能讀到該資料夾

### 3. 為什麼匯入 Excel 後舊訂單不見了

這是目前設計規格。

Excel 匯入採用：

- 覆蓋菜單
- 一併清空舊訂單

目的是避免舊訂單對應到已不存在或已變更的菜單 ID。

### 4. 如何看 MySQL 內容

有兩種方式：

- 用 phpMyAdmin: [http://localhost:8080](http://localhost:8080)
- 用你自己的 MySQL Client 連線到 `localhost:3306`

## 專案目錄

```text
.
├─ admin-frontend
├─ customer-frontend
├─ backend
├─ docs
├─ docker-compose.yml
├─ .env
└─ README.md
```

## 備註

- 後端啟動時會先等待 MySQL 可連線，再自動執行 migration
- 顧客端與後台是兩個不同的 React 網頁
- 本專案目前定位為本機開發與展示版本，不是正式 production 部署配置
