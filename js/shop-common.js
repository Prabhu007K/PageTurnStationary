/** Shared cart, login & checkout for index + product pages */
let cart = JSON.parse(localStorage.getItem('stationery-cart') || '[]');

function saveCart() {
  localStorage.setItem('stationery-cart', JSON.stringify(cart));
  updateCartUI();
}

function formatCartLabel(p, variantKey) {
  if (!variantKey || !p?.variants?.length) return p.name;
  const v = p.variants.find(x => x.key === variantKey);
  return v ? `${p.name} (${v.label})` : p.name;
}

function addToCart(id, variantKey) {
  const p = CatalogStore.getById(id);
  if (!p || p.stock <= 0) return alert('This item is out of stock.');
  if (p.variants?.length && !variantKey) variantKey = p.variants[0].key;
  const lineKey = CatalogStore.cartLineKey(id, variantKey);
  const item = cart.find(c => c.lineKey === lineKey);
  const qty = item ? item.qty + 1 : 1;
  if (qty > p.stock) return alert(`Only ${p.stock} in stock.`);
  if (item) item.qty++;
  else cart.push({ lineKey, id, variantKey: variantKey || null, qty: 1 });
  saveCart();
  return true;
}

function updateCartUI() {
  const countEl = document.getElementById('cart-count');
  if (!countEl) return;

  const products = CatalogStore.load();
  const count = cart.reduce((s, c) => s + c.qty, 0);
  countEl.textContent = count;

  const list = document.getElementById('cart-items');
  if (!list) return;

  let total = 0;
  list.innerHTML = cart.length ? cart.map(c => {
    const p = products.find(x => x.id === c.id);
    if (!p) return '';
    const price = CatalogStore.getVariantPrice(p, c.variantKey);
    const sub = price * c.qty;
    total += sub;
    return `<li class="cart-item">
      <span>${p.emoji}</span>
      <div class="cart-item-info">
        <strong>${escapeHtml(formatCartLabel(p, c.variantKey))}</strong><br>₹${price} × ${c.qty} = ₹${sub}
      </div>
      <div class="cart-item-qty">
        <button data-line="${escapeAttr(c.lineKey)}" data-d="-1">−</button>
        <span>${c.qty}</span>
        <button data-line="${escapeAttr(c.lineKey)}" data-d="1">+</button>
      </div>
    </li>`;
  }).join('') : '<li class="empty-cart">Cart is empty</li>';

  const totalEl = document.getElementById('cart-total');
  if (totalEl) totalEl.textContent = total;

  list.querySelectorAll('button[data-d]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lineKey = btn.dataset.line;
      const d = +btn.dataset.d;
      const item = cart.find(c => c.lineKey === lineKey);
      const p = CatalogStore.getById(item.id);
      if (d > 0 && item.qty >= (p?.stock ?? 0)) return alert(`Only ${p.stock} in stock.`);
      item.qty += d;
      if (item.qty <= 0) cart = cart.filter(c => c.lineKey !== lineKey);
      saveCart();
    });
  });
}

function updateUserUI() {
  const btn = document.getElementById('user-btn');
  if (!btn) return;
  const user = CatalogStore.getUser();
  if (user) {
    btn.textContent = `👤 ${user.name || user.phone || user.email || 'Account'}`;
    btn.title = 'View account & purchase history';
  } else {
    btn.textContent = 'Login';
    btn.title = 'Login with phone or email';
  }
}

function formatOrderDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium', timeStyle: 'short',
    });
  } catch { return iso; }
}

function statusLabel(status) {
  return ({ new: 'Placed', confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' })[status] || status;
}

function renderPurchaseHistory() {
  const list = document.getElementById('purchase-history-list');
  const empty = document.getElementById('purchase-history-empty');
  if (!list) return;

  const user = CatalogStore.getUser();
  const purchases = user ? CatalogStore.getUserPurchaseHistory(user) : [];

  if (!purchases.length) {
    list.innerHTML = '';
    empty?.classList.remove('hidden');
    return;
  }

  empty?.classList.add('hidden');
  list.innerHTML = purchases.map(p => {
    const status = CatalogStore.getOrderStatus(p.orderId) || p.status || 'new';
    const itemsText = p.lineItems?.length
      ? p.lineItems.map(i => `${escapeHtml(i.name)} ×${i.qty}`).join(', ')
      : escapeHtml(p.items || '');
    return `<li class="purchase-item">
      <div class="purchase-item-head">
        <time>${formatOrderDate(p.created)}</time>
        <span class="purchase-status status-${status}">${statusLabel(status)}</span>
      </div>
      <p class="purchase-items">${itemsText}</p>
      <p class="purchase-total">Total: ₹${p.total}</p>
    </li>`;
  }).join('');
}

function openAccount() {
  const modal = document.getElementById('account-modal');
  if (!modal) return;
  const user = CatalogStore.getUser();
  if (!user) return;

  const label = user.name || user.phone || user.email || 'Account';
  document.getElementById('account-name').textContent = label;
  const contact = [user.phone, user.email].filter(Boolean).join(' · ');
  document.getElementById('account-contact').textContent = contact;
  renderPurchaseHistory();
  modal.showModal();
}

function openLogin() {
  const modal = document.getElementById('login-modal');
  if (!modal) return;
  const user = CatalogStore.getUser();
  if (user) {
    openAccount();
    return;
  }
  document.getElementById('login-form').reset();
  document.getElementById('login-error').hidden = true;
  switchLoginTab('phone');
  modal.showModal();
}

function switchLoginTab(tab) {
  document.querySelectorAll('.login-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('phone-fields').classList.toggle('hidden', tab !== 'phone');
  document.getElementById('email-fields').classList.toggle('hidden', tab !== 'email');
}

function initShopCommon() {
  updateUserUI();
  updateCartUI();

  const userBtn = document.getElementById('user-btn');
  if (userBtn) userBtn.addEventListener('click', openLogin);

  document.querySelectorAll('.login-tab').forEach(tab => {
    tab.addEventListener('click', () => switchLoginTab(tab.dataset.tab));
  });

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const activeTab = document.querySelector('.login-tab.active')?.dataset.tab;
      const name = document.getElementById('login-name').value.trim();
      const phone = document.getElementById('login-phone').value.trim();
      const email = document.getElementById('login-email').value.trim();
      const err = document.getElementById('login-error');

      if (activeTab === 'phone') {
        if (!/^[0-9]{10}$/.test(phone)) {
          err.textContent = 'Enter a valid 10-digit phone number.';
          err.hidden = false;
          return;
        }
        CatalogStore.loginUser({ name, phone, email: '' });
      } else {
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          err.textContent = 'Enter a valid email address.';
          err.hidden = false;
          return;
        }
        CatalogStore.loginUser({ name, phone: '', email });
      }
      err.hidden = true;
      updateUserUI();
      document.getElementById('login-modal').close();
    });
  }

  const loginCancel = document.getElementById('login-cancel');
  if (loginCancel) loginCancel.addEventListener('click', () => document.getElementById('login-modal').close());

  document.getElementById('account-close')?.addEventListener('click', () => {
    document.getElementById('account-modal')?.close();
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    CatalogStore.logoutUser();
    updateUserUI();
    document.getElementById('account-modal')?.close();
  });

  const cartDrawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('overlay');
  const openCart = () => { cartDrawer?.classList.add('open'); overlay?.classList.add('show'); };
  const closeCart = () => { cartDrawer?.classList.remove('open'); overlay?.classList.remove('show'); };

  document.getElementById('cart-toggle')?.addEventListener('click', openCart);
  document.getElementById('cart-close')?.addEventListener('click', closeCart);
  overlay?.addEventListener('click', closeCart);

  document.getElementById('checkout-btn')?.addEventListener('click', () => {
    if (!cart.length) return alert('Your cart is empty.');
    const user = CatalogStore.getUser();
    if (user) {
      document.getElementById('cust-name').value = user.name || '';
      document.getElementById('cust-phone').value = user.phone || '';
      document.getElementById('cust-email').value = user.email || '';
    }
    document.getElementById('checkout-modal').showModal();
  });

  document.getElementById('checkout-cancel')?.addEventListener('click', () => {
    document.getElementById('checkout-modal').close();
  });

  document.getElementById('checkout-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const email = document.getElementById('cust-email').value.trim();
    const address = document.getElementById('cust-address').value.trim();
    if (!phone && !email) {
      alert('Please provide a phone number or email for order updates.');
      return;
    }
    const products = CatalogStore.load();
    const lineItems = cart.map(c => {
      const p = products.find(x => x.id === c.id);
      const price = CatalogStore.getVariantPrice(p, c.variantKey);
      return {
        id: c.id,
        variantKey: c.variantKey,
        name: formatCartLabel(p, c.variantKey),
        qty: c.qty,
        price,
      };
    });
    const total = lineItems.reduce((s, i) => s + i.price * i.qty, 0);
    const items = lineItems.map(i => `${i.name} ×${i.qty}`).join(', ');

    cart.forEach(c => CatalogStore.reduceStock(c.id, c.qty));

    const loggedIn = CatalogStore.getUser();
    const historyKey = loggedIn
      ? CatalogStore.userKey(loggedIn)
      : CatalogStore.userKey({ phone, email });

    const orderId = CatalogStore.saveOrder({ name, phone, email, address, items, total, userKey: historyKey });

    if (historyKey) {
      CatalogStore.addPurchaseToHistory(historyKey, {
        orderId,
        name,
        phone,
        email,
        address,
        items,
        lineItems,
        total,
        status: 'new',
      });
    }

    document.getElementById('order-summary').textContent =
      `Thanks ${name}! Order: ${items}. Total ₹${total}.`;

    cart = [];
    saveCart();
    document.getElementById('checkout-modal').close();
    closeCart();
    document.getElementById('success-modal').showModal();
    if (typeof onOrderComplete === 'function') onOrderComplete();
  });

  document.getElementById('success-close')?.addEventListener('click', () => {
    document.getElementById('success-modal').close();
  });
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function categoryLabel(cat) {
  return ({ books: 'Books', pens: 'Pens', pencils: 'Pencils', notebooks: 'Notebooks', accessories: 'Accessories' })[cat] || cat;
}

document.addEventListener('DOMContentLoaded', initShopCommon);
