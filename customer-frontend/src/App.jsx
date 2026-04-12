import { useEffect, useMemo, useRef, useState } from "react";

function formatCurrency(value) {
  return `NT$ ${Number(value).toFixed(2)}`;
}

const initialChatMessages = [
  {
    role: "assistant",
    content: "你好，我是 Gemini 點餐助理。你可以直接叫我幫你加菜、改數量、刪除品項，我會同步更新右側購物車。",
  },
];

function buildMenuSignature(menuItems) {
  return JSON.stringify(
    [...menuItems]
      .sort((left, right) => Number(left.id) - Number(right.id))
      .map((item) => [item.id, item.name, item.price, item.allergens, item.description]),
  );
}

function hasUnknownActionItems(actions, menuItems) {
  if (!Array.isArray(actions) || actions.length === 0) {
    return false;
  }

  const menuIds = new Set(menuItems.map((item) => Number(item.id)));
  return actions.some((action) => {
    if (!action || typeof action !== "object") {
      return false;
    }

    if (!("menu_item_id" in action)) {
      return false;
    }

    return !menuIds.has(Number(action.menu_item_id));
  });
}

function App() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [chatMessages, setChatMessages] = useState(initialChatMessages);
  const chatBodyRef = useRef(null);
  const menuSignatureRef = useRef("");

  async function loadMenu(options = {}) {
    const { showLoading = true, silent = false, returnDetails = false } = options;

    if (showLoading) {
      setLoading(true);
    }

    if (!silent) {
      setError("");
    }

    try {
      const response = await fetch("/api/menu-items/");
      if (!response.ok) {
        throw new Error("無法載入菜單。");
      }

      const data = await response.json();
      const nextSignature = buildMenuSignature(data);
      const previousSignature = menuSignatureRef.current;

      const changed = Boolean(previousSignature && previousSignature !== nextSignature);

      if (changed) {
        setCart({});
        setChatMessages(initialChatMessages);
        setChatInput("");
        setChatError("");
        setSuccess("菜單已更新，已清空購物車並重置助理對話。");
      }

      menuSignatureRef.current = nextSignature;
      setMenu(data);
      if (returnDetails) {
        return { data, changed };
      }
      return data;
    } catch (err) {
      if (!silent) {
        setError(err.message);
      }
      if (returnDetails) {
        return { data: null, changed: false };
      }
      return null;
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    loadMenu();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadMenu({ showLoading: false, silent: true });
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!chatBodyRef.current) {
      return;
    }

    chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
  }, [chatMessages]);

  function changeQuantity(itemId, nextQuantity) {
    setCart((current) => {
      const normalized = Math.max(0, nextQuantity);
      const updated = { ...current };

      if (normalized === 0) {
        delete updated[itemId];
      } else {
        updated[itemId] = normalized;
      }

      return updated;
    });
  }

  function applyChatActions(actions) {
    if (!Array.isArray(actions) || actions.length === 0) {
      return;
    }

    setCart((current) => {
      let next = { ...current };

      actions.forEach((action) => {
        if (!action || typeof action !== "object") {
          return;
        }

        if (action.type === "clear_cart") {
          next = {};
          return;
        }

        if (action.type === "remove_item") {
          delete next[action.menu_item_id];
          return;
        }

        if (action.type === "set_quantity") {
          const quantity = Number(action.quantity);
          if (!Number.isFinite(quantity) || quantity <= 0) {
            delete next[action.menu_item_id];
          } else {
            next[action.menu_item_id] = quantity;
          }
        }
      });

      return next;
    });
  }

  const cartItems = useMemo(() => {
    return menu
      .filter((item) => cart[item.id] > 0)
      .map((item) => {
        const quantity = cart[item.id];
        const lineTotal = Number(item.price) * quantity;
        return {
          ...item,
          quantity,
          lineTotal,
        };
      });
  }, [cart, menu]);

  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);

  async function submitOrder() {
    if (cartItems.length === 0) {
      setError("購物車是空的，請先加入菜品。");
      setSuccess("");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    const payload = {
      items: cartItems.map((item) => ({
        menu_item_id: item.id,
        quantity: item.quantity,
      })),
    };

    try {
      const response = await fetch("/api/orders/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "送出訂單失敗。");
      }

      setCart({});
      setSuccess(`訂單 #${data.id} 已送出，總金額 ${formatCurrency(data.total_price)}。`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function clearCart() {
    setCart({});
    setSuccess("");
    setError("");
  }

  async function sendChatMessage(event) {
    event.preventDefault();

    const content = chatInput.trim();
    if (!content || chatLoading) {
      return;
    }

    const userMessage = { role: "user", content };
    const nextMessages = [...chatMessages, userMessage];

    setChatMessages(nextMessages);
    setChatInput("");
    setChatError("");
    setChatLoading(true);

    try {
      const latestMenuResult = await loadMenu({
        showLoading: false,
        silent: true,
        returnDetails: true,
      });
      const latestMenu = latestMenuResult.data;
      const currentMenu = Array.isArray(latestMenu) ? latestMenu : menu;
      const messagesForRequest = latestMenuResult.changed
        ? [...initialChatMessages, userMessage]
        : nextMessages;
      const cartForRequest = latestMenuResult.changed ? {} : cart;

      const response = await fetch("/api/chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messagesForRequest.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          cart: Object.entries(cartForRequest).map(([menuItemId, quantity]) => ({
            menu_item_id: Number(menuItemId),
            quantity,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gemini 回覆失敗。");
      }

      if (hasUnknownActionItems(data.actions, currentMenu)) {
        await loadMenu({ showLoading: false, silent: true });
      }

      applyChatActions(data.actions);

      setChatMessages([
        ...messagesForRequest,
        {
          role: "assistant",
          content: data.reply || "已為您更新購物車。",
        },
      ]);
    } catch (err) {
      setChatError(err.message);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="customer-app">
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Smart Dining</p>
          <h1>智慧點餐系統</h1>
          <p>
            先挑選菜品加入購物車，再送出訂單。右側的 Gemini 點餐助理可以直接幫你加菜、改數量、刪除品項。
          </p>
        </div>

        <div className="hero-badge">
          <span>目前購物車</span>
          <strong>{totalQuantity} 項</strong>
          <em>{formatCurrency(totalPrice)}</em>
        </div>
      </header>

      <main className="customer-layout">
        <section className="menu-section">
          <div className="section-header">
            <div>
              <p className="section-kicker">Menu</p>
              <h2>今日菜單</h2>
            </div>
            <button className="ghost-button" onClick={loadMenu} type="button">
              重新載入
            </button>
          </div>

          {loading ? (
            <p className="state-text">菜單載入中...</p>
          ) : menu.length === 0 ? (
            <p className="state-text">目前沒有菜單資料。</p>
          ) : (
            <div className="menu-grid">
              {menu.map((item) => {
                const quantity = cart[item.id] || 0;
                return (
                  <article className="dish-card" key={item.id}>
                    <div className="dish-top">
                      <span className="dish-id">ID {item.id}</span>
                      <span className="dish-price">{formatCurrency(item.price)}</span>
                    </div>

                    <h3>{item.name}</h3>
                    <p>{item.description || "尚無菜品介紹。"}</p>
                    <span className="allergen-chip">過敏原：{item.allergens || "無"}</span>

                    <div className="quantity-bar">
                      <button
                        className="step-button"
                        onClick={() => changeQuantity(item.id, quantity - 1)}
                        type="button"
                      >
                        -
                      </button>
                      <span>{quantity}</span>
                      <button
                        className="step-button"
                        onClick={() => changeQuantity(item.id, quantity + 1)}
                        type="button"
                      >
                        +
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <div className="side-column">
          <aside className="cart-section">
            <div className="section-header">
              <div>
                <p className="section-kicker">Cart</p>
                <h2>購物車</h2>
              </div>
            </div>

            {cartItems.length === 0 ? (
              <p className="state-text">購物車目前沒有品項。</p>
            ) : (
              <div className="cart-list">
                {cartItems.map((item) => (
                  <div className="cart-row" key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>
                        {item.quantity} x {formatCurrency(item.price)}
                      </span>
                    </div>
                    <b>{formatCurrency(item.lineTotal)}</b>
                  </div>
                ))}
              </div>
            )}

            <div className="cart-summary">
              <div>
                <span>總數量</span>
                <strong>{totalQuantity}</strong>
              </div>
              <div>
                <span>總金額</span>
                <strong>{formatCurrency(totalPrice)}</strong>
              </div>
            </div>

            <div className="cart-actions">
              <button
                className="secondary-button"
                disabled={submitting || cartItems.length === 0}
                onClick={clearCart}
                type="button"
              >
                清空購物車
              </button>
              <button
                className="checkout-button"
                disabled={submitting || cartItems.length === 0}
                onClick={submitOrder}
                type="button"
              >
                {submitting ? "送單中..." : "送出訂單"}
              </button>
            </div>

            {success ? <p className="feedback success">{success}</p> : null}
            {error ? <p className="feedback error">{error}</p> : null}
          </aside>

          <section className="chat-panel">
            <div className="chat-header">
              <div>
                <p className="section-kicker">Assistant</p>
                <h2>Gemini 點餐助理</h2>
              </div>
            </div>

            <div className="chat-messages" ref={chatBodyRef}>
              {chatMessages.map((message, index) => (
                <article
                  className={`chat-message ${message.role}`}
                  key={`${message.role}-${index}`}
                >
                  <span className="chat-role">{message.role === "assistant" ? "Gemini" : "你"}</span>
                  <p>{message.content}</p>
                </article>
              ))}

              {chatLoading ? (
                <article className="chat-message assistant">
                  <span className="chat-role">Gemini</span>
                  <p>處理中...</p>
                </article>
              ) : null}
            </div>

            {chatError ? <p className="feedback error">{chatError}</p> : null}

            <form className="chat-form" onSubmit={sendChatMessage}>
              <textarea
                className="chat-input"
                disabled={chatLoading}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="例如：幫我加兩份鍋貼，再把飲料改成一杯烏龍茶"
                rows={3}
                value={chatInput}
              />
              <button className="checkout-button chat-submit" disabled={chatLoading} type="submit">
                {chatLoading ? "送出中..." : "送出問題"}
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
