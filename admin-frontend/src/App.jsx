import { useEffect, useState } from "react";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  allergens: "",
};

function formatCurrency(value) {
  return `NT$ ${Number(value).toFixed(2)}`;
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

async function parseJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `伺服器回傳不是 JSON（HTTP ${response.status}）。請確認後端服務已啟動，並查看 Docker backend logs。`
    );
  }
}

function App() {
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadItems() {
    setLoadingItems(true);

    try {
      const response = await fetch("/api/menu-items/");
      if (!response.ok) {
        throw new Error("無法載入菜單資料");
      }

      const data = await parseJsonResponse(response);
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingItems(false);
    }
  }

  async function loadOrders() {
    setLoadingOrders(true);

    try {
      const response = await fetch("/api/orders/");
      if (!response.ok) {
        throw new Error("無法載入訂單資料");
      }

      const data = await parseJsonResponse(response);
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingOrders(false);
    }
  }

  async function refreshAll() {
    setError("");
    await Promise.all([loadItems(), loadOrders()]);
  }

  useEffect(() => {
    refreshAll();

    const timer = window.setInterval(() => {
      loadOrders();
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function handleFileChange(event) {
    const nextFile = event.target.files?.[0] || null;
    setSelectedFile(nextFile);
    setMessage("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      ...form,
      price: form.price === "" ? "" : Number(form.price).toFixed(2),
    };

    const url = editingId ? `/api/menu-items/${editingId}/` : "/api/menu-items/";
    const method = editingId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await parseJsonResponse(response);
      if (!response.ok) {
        throw new Error(data.error || "儲存失敗");
      }

      setMessage(editingId ? "菜品已更新" : "菜品已新增");
      resetForm();
      await loadItems();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description,
      price: item.price,
      allergens: item.allergens,
    });
    setMessage("");
    setError("");
  }

  async function deleteItem(id) {
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/menu-items/${id}/`, {
        method: "DELETE",
      });
      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "刪除失敗");
      }

      if (editingId === id) {
        resetForm();
      }

      setMessage("菜品已刪除");
      await loadItems();
    } catch (err) {
      setError(err.message);
    }
  }

  async function importMenuFromExcel() {
    if (!selectedFile) {
      setError("請先選擇一個 xlsx 檔案");
      setMessage("");
      return;
    }

    setImporting(true);
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/menu-items/import-xlsx/", {
        method: "POST",
        body: formData,
      });
      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "Excel 匯入失敗");
      }

      setSelectedFile(null);
      resetForm();
      setMessage(data.message || "Excel 匯入完成");
      await refreshAll();
    } catch (err) {
      setError(err.message);
    } finally {
      const fileInput = document.getElementById("menu-xlsx-upload");
      if (fileInput) {
        fileInput.value = "";
      }
      setImporting(false);
    }
  }

  async function deleteOrder(orderId) {
    setDeletingOrderId(orderId);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/orders/${orderId}/`, {
        method: "DELETE",
      });
      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || "刪除訂單失敗");
      }

      setMessage("訂單已刪除");
      await loadOrders();
      await loadItems();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingOrderId(null);
    }
  }

  return (
    <div className="admin-app">
      <aside className="sidebar">
        <p className="sidebar-kicker">Back Office</p>
        <h1>後臺管理系統</h1>
        <p className="sidebar-copy">
          這個頁面同時管理菜單與顧客送出的訂單。顧客點餐頁獨立在
          `localhost:5174`。
        </p>

        <div className="sidebar-stats">
          <div>
            <span>菜品總數</span>
            <strong>{items.length}</strong>
          </div>
          <div>
            <span>目前訂單數</span>
            <strong>{orders.length}</strong>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <section className="panel orders-panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Incoming Orders</p>
              <h2>訂單列表</h2>
            </div>
            <button className="subtle-button" onClick={loadOrders} type="button">
              重新整理
            </button>
          </div>

          {loadingOrders ? (
            <p className="state-text">載入訂單中...</p>
          ) : orders.length === 0 ? (
            <p className="state-text">目前沒有訂單。</p>
          ) : (
            <div className="orders-grid">
              {orders.map((order) => (
                <article className="order-card" key={order.id}>
                  <div className="order-header">
                    <div>
                      <span className="order-label">訂單 #{order.id}</span>
                      <h3>{formatCurrency(order.total_price)}</h3>
                    </div>
                    <button
                      className="danger-button"
                      disabled={deletingOrderId === order.id}
                      onClick={() => deleteOrder(order.id)}
                      type="button"
                    >
                      {deletingOrderId === order.id ? "刪除中..." : "刪除訂單"}
                    </button>
                  </div>

                  <p className="order-time">{formatDateTime(order.created_at)}</p>

                  <div className="order-items">
                    {order.items.map((item) => (
                      <div className="order-item-row" key={item.id}>
                        <div>
                          <strong>{item.menu_item_name}</strong>
                          <span>
                            {item.quantity} x {formatCurrency(item.unit_price)}
                          </span>
                        </div>
                        <b>{formatCurrency(item.line_total)}</b>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="panel form-panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Menu CRUD</p>
              <h2>{editingId ? "編輯菜品" : "新增菜品"}</h2>
            </div>
            {editingId ? (
              <button className="subtle-button" onClick={resetForm} type="button">
                取消
              </button>
            ) : null}
          </div>

          <form className="menu-form" onSubmit={handleSubmit}>
            <label>
              菜品名稱
              <input
                name="name"
                value={form.name}
                onChange={updateField}
                placeholder="例如：松露野菇燉飯"
                required
              />
            </label>

            <label>
              菜品介紹
              <textarea
                name="description"
                value={form.description}
                onChange={updateField}
                rows="4"
                placeholder="描述食材、風味與賣點"
              />
            </label>

            <div className="form-row">
              <label>
                菜品價格
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={updateField}
                  placeholder="320"
                  required
                />
              </label>

              <label>
                過敏原
                <input
                  name="allergens"
                  value={form.allergens}
                  onChange={updateField}
                  placeholder="奶類、堅果"
                />
              </label>
            </div>

            <button className="primary-button" disabled={saving} type="submit">
              {saving ? "儲存中..." : editingId ? "更新菜品" : "新增菜品"}
            </button>
          </form>

          <div className="import-panel">
            <div>
              <p className="panel-kicker">Excel Import</p>
              <h3>用指定欄位格式覆蓋菜單</h3>
              <p className="import-copy">
                欄位順序必須是：菜品名稱、菜品價格、過敏原、菜品介紹。匯入會覆蓋目前
                的菜品資料，並同時清空舊訂單與舊訂單明細。
              </p>
            </div>

            <div className="import-actions">
              <label className="file-button" htmlFor="menu-xlsx-upload">
                選擇 xlsx
              </label>
              <input
                accept=".xlsx"
                id="menu-xlsx-upload"
                onChange={handleFileChange}
                type="file"
              />
              <span className="file-name">
                {selectedFile ? selectedFile.name : "尚未選擇檔案"}
              </span>
              <button
                className="primary-button"
                disabled={importing}
                onClick={importMenuFromExcel}
                type="button"
              >
                {importing ? "匯入中..." : "匯入並覆蓋菜單"}
              </button>
            </div>
          </div>

          {message ? <p className="feedback success">{message}</p> : null}
          {error ? <p className="feedback error">{error}</p> : null}
        </section>

        <section className="panel table-panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Current Menu</p>
              <h2>菜單清單</h2>
            </div>
            <button className="subtle-button" onClick={loadItems} type="button">
              重新整理
            </button>
          </div>

          {loadingItems ? (
            <p className="state-text">載入中...</p>
          ) : items.length === 0 ? (
            <p className="state-text">目前沒有菜品，請先新增第一道菜。</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>菜品名稱</th>
                    <th>介紹</th>
                    <th>價格</th>
                    <th>過敏原</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.name}</td>
                      <td>{item.description || "未填寫"}</td>
                      <td>{formatCurrency(item.price)}</td>
                      <td>{item.allergens || "未標記"}</td>
                      <td>
                        <div className="action-row">
                          <button
                            className="subtle-button"
                            onClick={() => startEdit(item)}
                            type="button"
                          >
                            編輯
                          </button>
                          <button
                            className="danger-button"
                            onClick={() => deleteItem(item.id)}
                            type="button"
                          >
                            刪除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

export default App;
