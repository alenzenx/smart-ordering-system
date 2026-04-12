# 智慧點餐系統安裝與內部邏輯教學簡報

> 使用方式：這份 Markdown 以 `---` 分隔投影片。你可以直接複製到 Canva、Google Slides、PowerPoint，或搭配同目錄的 `smart-ordering-system-tutorial.html` 用瀏覽器播放。

---

## 1. 教學目標

- 讓第一次看到專案的人，可以用少量指令完成啟動。
- 讓使用者知道哪些東西需要安裝，哪些由 Docker 自動處理。
- 讓使用者知道 Gemini CLI 怎麼登入，以及為什麼登入資料要掛到 container。
- 讓使用者理解顧客端、後台、Django、MySQL、phpMyAdmin、Gemini 助理之間的關係。
- 讓使用者理解購物車真正更新依據是 `actions`，不是 Gemini 的自然語言文字。

講者提示：
這份教學是給第一次接觸專案的人。重點不是背技術名詞，而是能照著一步一步跑起來、知道出問題去哪裡看。

---

## 2. 系統畫面：顧客端

![顧客端智慧點餐系統](../order_system.png)

- 顧客端網址：`http://localhost:5174`
- 左側是菜單卡片。
- 右側有購物車與 Gemini 點餐助理。
- 顧客可用按鈕加減數量，也可用自然語言點餐。

講者提示：
顧客端的重點是即時計算價格。Gemini 助理只是輔助輸入，最後仍會轉成購物車 actions。

---

## 3. 系統畫面：後台管理

![後台管理系統](../order_system_backstage.png)

- 後台網址：`http://localhost:5173`
- 訂單列表在最上方。
- 可新增、修改、刪除菜品。
- 可匯入 Excel 覆蓋菜單。
- 匯入菜單時會一併清空舊訂單。

講者提示：
這裡是店家管理端。顧客送出訂單後，後台可以看到並刪除訂單。

---

## 4. 系統架構總覽

```text
顧客端 React  : http://localhost:5174
後台 React    : http://localhost:5173
Django API    : http://localhost:8000
MySQL         : localhost:3306
phpMyAdmin    : http://localhost:8080
Gemini CLI    : backend container 內呼叫
```

- 前端負責畫面與使用者互動。
- 後端負責資料驗證、訂單建立、Excel 匯入、聊天 actions 驗證。
- MySQL 負責保存菜單與訂單。
- phpMyAdmin 負責圖形化查看 MySQL。

講者提示：
把它想成三層：前端畫面、後端 API、資料庫。Gemini 助理是掛在後端聊天 API 後面的一個外部智慧來源。

---

## 5. 必要安裝

- 必裝：Docker Desktop for Windows。
- 建議安裝：Git。
- 若要在主機登入 Gemini CLI：需要 Node.js 20 或更新版本。
- 不需要手動安裝：Python、MySQL、phpMyAdmin、前端 npm 套件。

講者提示：
本專案主打零設定啟動，所以除 Docker 外，大多東西都由 container 處理。Node.js 只在你要做主機端 Gemini CLI 登入時才需要。

---

## 6. 檢查 Docker 與 Git

PowerShell 輸入：

```powershell
docker --version
docker compose version
git --version
```

- 如果 Docker 指令失敗，先打開 Docker Desktop。
- 等 Docker Desktop 顯示 Engine 已啟動後再重試。
- 如果 `git --version` 失敗，代表尚未安裝 Git，仍可用下載 zip 的方式取得專案。

講者提示：
這一步是為了排除最常見問題：Docker Desktop 沒開，或 Docker Engine 還沒啟動。

---

## 7. 取得專案

建議方式：

```powershell
git clone https://github.com/alenzenx/smart-ordering-system.git
cd smart-ordering-system
```

如果已經有專案資料夾：

```powershell
cd "C:\Users\Alen\Documents\New project"
```

專案根目錄應該看到：

```text
docker-compose.yml
README.md
backend
admin-frontend
customer-frontend
```

講者提示：
所有 Docker 指令都要在專案根目錄執行，因為 `docker-compose.yml` 在這裡。

---

## 8. 零設定啟動

在專案根目錄執行：

```powershell
docker compose up --build -d
```

查看狀態：

```powershell
docker compose ps
```

關閉全部服務：

```powershell
docker compose down
```

講者提示：
第一次會下載 image 和安裝套件，比較慢是正常的。`-d` 代表背景執行。

---

## 9. 預期啟動的服務

```text
smart-ordering-db
smart-ordering-backend
smart-ordering-admin-frontend
smart-ordering-customer-frontend
smart-ordering-phpmyadmin
```

- `db`：MySQL 8.4。
- `backend`：Django API。
- `admin-frontend`：後台 React。
- `customer-frontend`：顧客端 React。
- `phpmyadmin`：資料庫圖形介面。

講者提示：
如果其中一個不是 Up，先看 `docker compose logs <service>`，例如 `docker compose logs backend --tail 100`。

---

## 10. 開啟服務網址

- 顧客端：`http://localhost:5174`
- 後台：`http://localhost:5173`
- Django API：`http://localhost:8000`
- phpMyAdmin：`http://localhost:8080`
- MySQL：`localhost:3306`

講者提示：
前端與後台是不同網頁。顧客下單後，後台訂單列表會收到訂單。

---

## 11. Docker 幫你安裝了什麼

- 前端 container 內執行 `npm install`。
- 前端 container 內執行 Vite dev server。
- 後端 container 內執行 `pip install -r requirements.txt`。
- 後端 container 內安裝 Gemini CLI：

```dockerfile
RUN npm install -g @google/gemini-cli@latest
```

- MySQL 與 phpMyAdmin 直接使用 Docker image。

講者提示：
這就是為什麼你本機不需要先裝 Python 或 MySQL。Docker 讓環境一致。

---

## 12. Gemini CLI 的角色

- Gemini CLI 是顧客端點餐助理的 LLM 來源。
- 有登入：後端優先呼叫 Gemini CLI。
- 沒登入或不可用：後端退回本地規則模式。
- 系統不會因 Gemini CLI 失敗就不能點餐。
- 後端仍會驗證 Gemini 回傳的 actions。

講者提示：
Gemini CLI 不是核心資料庫，也不是訂單系統。它只是幫忙理解自然語言，最後仍要經過後端驗證。

---

## 13. 安裝 Gemini CLI 前提

如果要在 Windows 主機登入 Gemini CLI，需要先有 Node.js。

檢查：

```powershell
node --version
npm --version
```

如果沒有 Node.js：

- 安裝 Node.js 20 或更新版本。
- 安裝後重新開 PowerShell。
- 再次執行 `node --version` 與 `npm --version`。

講者提示：
注意：Docker 裡已經有 Gemini CLI，但登入動作通常需要主機端產生 `%USERPROFILE%\.gemini` 登入資料。

---

## 14. 安裝與登入 Gemini CLI

安裝：

```powershell
npm install -g @google/gemini-cli
```

啟動登入：

```powershell
gemini
```

接著：

- 選擇 `Login with Google`。
- 在瀏覽器完成 Google 登入。
- 確認產生 `%USERPROFILE%\.gemini` 資料夾。

講者提示：
登入資料不是放在專案裡，也不應提交到 GitHub。它是你本機使用者的登入資料。

---

## 15. Docker 如何使用 Gemini 登入資料

`docker-compose.yml` 內有掛載：

```yaml
volumes:
  - ${USERPROFILE}/.gemini:/root/.gemini
```

代表：

```text
Windows:   %USERPROFILE%\.gemini
Container: /root/.gemini
```

完成登入後重建後端：

```powershell
docker compose up --build -d backend
```

講者提示：
如果主機端 `.gemini` 沒有有效登入資料，container 內也讀不到登入狀態。

---

## 16. 顧客端怎麼使用

- 開啟 `http://localhost:5174`。
- 用菜單卡片的 `+` / `-` 加減數量。
- 購物車即時計算數量與總價。
- 可按 `清空購物車`。
- 可按 `送出訂單`。
- 可問 Gemini 助理：

```text
來杯冰的
烏龍
兩份
清空
推薦一個飯類
```

講者提示：
Gemini 助理不能直接送出訂單。送出訂單必須按頁面上的按鈕。

---

## 17. 後台怎麼使用

- 開啟 `http://localhost:5173`。
- 最上方是訂單列表。
- 可查看顧客送出的訂單。
- 可刪除訂單。
- 可新增、修改、刪除菜品。
- 可用 Excel 匯入整份菜單。

講者提示：
後台是店家管理端。顧客端的訂單會透過 Django API 寫入 MySQL，再由後台讀出。

---

## 18. Excel 匯入規則

Excel 欄位：

```text
菜品名稱 | 菜品價格 | 過敏原 | 菜品介紹
```

匯入時會清空：

```text
menu_orderitem
menu_order
menu_menuitem
```

然後重新建立整份菜單。

講者提示：
匯入會重建菜單 ID，所以舊訂單一起清空是刻意設計，不是 bug。

---

## 19. MySQL 與 phpMyAdmin

phpMyAdmin：

```text
http://localhost:8080
```

MySQL 連線：

```text
Host: localhost
Port: 3306
Database: smart_ordering
User: smart_user
Password: smart_pass
Root Password: root_pass
```

主要資料表：

```text
menu_menuitem
menu_order
menu_orderitem
```

講者提示：
如果只是查看資料，用 phpMyAdmin 最直覺；如果要寫 SQL，可以參考 `docs/mysql-crud-examples.sql`。

---

## 20. 聊天助理內部流程

```text
顧客輸入
  ↓
React 前端送 messages + cart
  ↓
POST /api/chat/
  ↓
Django 後端先跑本地規則
  ↓
必要時呼叫 Gemini CLI
  ↓
後端驗證 actions
  ↓
前端依 actions 更新購物車
```

講者提示：
這裡的重點是：前端不相信自然語言文字，只相信後端驗證後的 actions。

---

## 21. actions 是購物車真正依據

支援三種 action：

```json
{"type":"set_quantity","menu_item_id":1,"quantity":2}
{"type":"remove_item","menu_item_id":1}
{"type":"clear_cart"}
```

後端保護：

- 如果文字說「已更新」但 actions 空白，後端會攔截。
- 如果能從上下文補出 action，後端會補上。
- 如果補不出來，後端會要求使用者說清楚。

講者提示：
這能避免 Gemini 只用文字說「已為您更新」，但購物車其實沒變。

---

## 22. 菜單同步與匯入後保護

- 顧客端每 5 秒檢查菜單是否變更。
- 送出聊天前會先同步菜單。
- 後台匯入新菜單後，顧客端會清空購物車並重置助理對話。
- 如果 actions 指向不存在的菜品 ID，前端會重新抓菜單。

講者提示：
這是為了處理 Excel 匯入後菜品 ID 重建的問題。

---

## 23. 常用維護指令

```powershell
docker compose up --build -d --remove-orphans
docker compose up --build -d backend
docker compose up --build -d customer-frontend
docker compose up --build -d admin-frontend
docker compose logs backend --tail 100
docker compose down
```

講者提示：
改後端後重建 backend；改顧客端後重建 customer-frontend；改後台後重建 admin-frontend。

---

## 24. 常見問題排除

- 網頁打不開：先跑 `docker compose ps`。
- Docker 指令失敗：打開 Docker Desktop。
- Gemini 回覆太簡單：可能正在使用 local-rules。
- Gemini 登入後仍無效：重建 backend。
- Excel 匯入後購物車清空：這是預期行為。
- 資料庫看不到：開 `http://localhost:8080`。

講者提示：
大多數問題都可以從 Docker 狀態、backend logs、phpMyAdmin 三個地方開始查。

---

## 25. 完成檢查清單

- 已能啟動所有服務。
- 已能開啟顧客端。
- 已能開啟後台。
- 已能開啟 phpMyAdmin。
- 已能匯入 Excel 菜單。
- 已能送出訂單並在後台看到。
- 已理解 Gemini CLI 登入資料掛載。
- 已理解 actions 才是購物車真正更新依據。

講者提示：
這張可以當最後驗收表。每一項都打勾，代表使用者已能基本操作和維護本專案。
