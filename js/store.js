const CatalogStore = (() => {
  const CATALOG_KEY = 'pageturn-catalog-v2';
  const ORDERS_KEY = 'pageturn-orders-v1';
  const USER_KEY = 'pageturn-user-v1';
  const HISTORY_KEY = 'pageturn-purchase-history-v1';

  const DEFAULT = [
    { id: 1, name: "Atomic Habits", category: "books", price: 399, emoji: "📘", image: "", desc: "Bestselling self-improvement guide", stock: 24, active: true, variantType: null, variants: [] },
    { id: 2, name: "Deep Work", category: "books", price: 349, emoji: "📗", image: "", desc: "Focus in a distracted world", stock: 18, active: true, variantType: null, variants: [] },
    {
      id: 3, name: "Classmate Notebook (200pg)", category: "notebooks", price: 89, emoji: "📓", image: "", desc: "Spiral bound notebook",
      stock: 40, active: true, variantType: "ruled",
      variants: [
        { key: "ruled", label: "Ruled", price: 89 },
        { key: "unruled", label: "Unruled", price: 95 },
      ],
    },
    {
      id: 4, name: "Art Sketch Pad A4", category: "notebooks", price: 149, emoji: "🎨", image: "", desc: "120gsm drawing paper",
      stock: 15, active: true, variantType: "ruled",
      variants: [
        { key: "ruled", label: "Ruled", price: 149 },
        { key: "unruled", label: "Unruled", price: 139 },
      ],
    },
    {
      id: 5, name: "Pilot G2 Gel Pen", category: "pens", price: 65, emoji: "🖊️", image: "", desc: "Smooth 0.7mm gel ink",
      stock: 60, active: true, variantType: "color",
      variants: [
        { key: "blue", label: "Blue", hex: "#2563eb", price: 65 },
        { key: "black", label: "Black", hex: "#1c1917", price: 65 },
        { key: "red", label: "Red", hex: "#dc2626", price: 68 },
        { key: "green", label: "Green", hex: "#16a34a", price: 68 },
      ],
    },
    {
      id: 6, name: "Reynolds Trimax", category: "pens", price: 120, emoji: "✒️", image: "", desc: "Fine tip ball pens (pack of 5)",
      stock: 30, active: true, variantType: "color",
      variants: [
        { key: "blue", label: "Blue", hex: "#2563eb", price: 120 },
        { key: "black", label: "Black", hex: "#374151", price: 120 },
      ],
    },
    {
      id: 7, name: "Faber-Castell 9000", category: "pencils", price: 45, emoji: "✏️", image: "", desc: "Premium graphite pencil",
      stock: 50, active: true, variantType: "color",
      variants: [
        { key: "hb", label: "HB", hex: "#78716c", price: 45 },
        { key: "2b", label: "2B", hex: "#44403c", price: 45 },
        { key: "4b", label: "4B", hex: "#292524", price: 48 },
      ],
    },
    {
      id: 8, name: "DOMS Colour Pencils (24)", category: "pencils", price: 199, emoji: "🖍️", image: "", desc: "Vibrant colour set",
      stock: 22, active: true, variantType: null, variants: [],
    },
    { id: 9, name: "Stapler with Pins", category: "accessories", price: 175, emoji: "📎", image: "", desc: "Heavy-duty desk stapler", stock: 12, active: true, variantType: null, variants: [] },
    { id: 10, name: "Geometry Box", category: "accessories", price: 129, emoji: "📐", image: "", desc: "Compass, protractor & ruler set", stock: 20, active: true, variantType: null, variants: [] },
    {
      id: 11, name: "Sticky Notes (Pack of 6)", category: "accessories", price: 99, emoji: "📝", image: "", desc: "Neon sticky notes",
      stock: 35, active: true, variantType: "color",
      variants: [
        { key: "yellow", label: "Yellow", hex: "#facc15", price: 99 },
        { key: "pink", label: "Pink", hex: "#f472b6", price: 99 },
        { key: "green", label: "Green", hex: "#4ade80", price: 99 },
        { key: "blue", label: "Blue", hex: "#60a5fa", price: 99 },
      ],
    },
    { id: 12, name: "The Psychology of Money", category: "books", price: 299, emoji: "📙", image: "", desc: "Timeless lessons on wealth", stock: 16, active: true, variantType: null, variants: [] },
  ];

  function normalizeProduct(p) {
    return {
      variantType: null,
      variants: [],
      image: '',
      ...p,
      variants: Array.isArray(p.variants) ? p.variants : [],
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(CATALOG_KEY);
      if (raw) return JSON.parse(raw).map(normalizeProduct);
    } catch { /* defaults */ }
    save(DEFAULT);
    return DEFAULT.map(normalizeProduct);
  }

  function save(products) {
    try {
      localStorage.setItem(CATALOG_KEY, JSON.stringify(products));
    } catch (err) {
      if (err.name === 'QuotaExceededError') {
        throw new Error('Storage full — try a smaller image or use an image URL instead.');
      }
      throw err;
    }
  }

  function getProducts(includeHidden = false) {
    const list = load();
    return includeHidden ? list : list.filter(p => p.active !== false);
  }

  function getById(id) {
    return load().find(p => p.id === id);
  }

  function getVariantPrice(product, variantKey) {
    if (!product.variants?.length || !variantKey) return product.price;
    const v = product.variants.find(x => x.key === variantKey);
    return v?.price ?? product.price;
  }

  function upsert(product) {
    const list = load();
    const normalized = normalizeProduct(product);
    const idx = list.findIndex(p => p.id === normalized.id);
    if (idx >= 0) list[idx] = normalized;
    else list.push(normalized);
    save(list);
    return list;
  }

  function remove(id) {
    save(load().filter(p => p.id !== id));
  }

  function nextId() {
    const list = load();
    return list.length ? Math.max(...list.map(p => p.id)) + 1 : 1;
  }

  function reduceStock(id, qty) {
    const list = load();
    const p = list.find(x => x.id === id);
    if (p) p.stock = Math.max(0, (p.stock ?? 0) - qty);
    save(list);
  }

  function loadOrders() {
    try { return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); }
    catch { return []; }
  }

  function saveOrder(order) {
    const orders = loadOrders();
    const id = Date.now();
    orders.unshift({ ...order, id, status: 'new', created: new Date().toISOString() });
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders.slice(0, 50)));
    return id;
  }

  function updateOrderStatus(id, status) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(loadOrders().map(o => o.id === id ? { ...o, status } : o)));
  }

  function getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function loginUser({ name, phone, email }) {
    const user = {
      name: (name || '').trim(),
      phone: (phone || '').trim(),
      email: (email || '').trim(),
      loggedInAt: new Date().toISOString(),
    };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  }

  function logoutUser() {
    localStorage.removeItem(USER_KEY);
  }

  function userKey({ phone, email } = {}) {
    if (phone) return `phone:${phone}`;
    if (email) return `email:${String(email).trim().toLowerCase()}`;
    return null;
  }

  function loadPurchaseHistoryMap() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}'); }
    catch { return {}; }
  }

  function getUserPurchaseHistory(userOrKey) {
    const key = typeof userOrKey === 'string' ? userOrKey : userKey(userOrKey);
    if (!key) return [];
    return loadPurchaseHistoryMap()[key] || [];
  }

  function addPurchaseToHistory(userOrKey, purchase) {
    const key = typeof userOrKey === 'string' ? userOrKey : userKey(userOrKey);
    if (!key) return;
    const map = loadPurchaseHistoryMap();
    const list = map[key] || [];
    list.unshift({
      ...purchase,
      id: purchase.orderId || Date.now(),
      created: purchase.created || new Date().toISOString(),
    });
    map[key] = list.slice(0, 100);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(map));
  }

  function getOrderStatus(orderId) {
    const order = loadOrders().find(o => o.id === orderId);
    return order?.status || 'new';
  }

  function cartLineKey(id, variantKey) {
    return variantKey ? `${id}:${variantKey}` : String(id);
  }

  return {
    load, save, getProducts, getById, getVariantPrice, upsert, remove, nextId, reduceStock,
    loadOrders, saveOrder, updateOrderStatus, cartLineKey,
    getUser, loginUser, logoutUser, userKey, getUserPurchaseHistory, addPurchaseToHistory, getOrderStatus,
    DEFAULT,
  };
})();
