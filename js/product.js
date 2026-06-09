let selectedVariant = null;
let product = null;

function getProductId() {
  return +new URLSearchParams(location.search).get('id');
}

function renderDetailImage(p) {
  if (p.image) {
    return `<div class="detail-image detail-image-photo">
      <img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <span class="detail-image-fallback">${p.emoji || '📦'}</span>
    </div>`;
  }
  return `<div class="detail-image">${p.emoji || '📦'}</div>`;
}

function getSelectedVariantKey() {
  if (!product.variants?.length) return null;
  return selectedVariant || product.variants[0].key;
}

function renderVariantSection() {
  if (!product.variants?.length) return '';

  if (product.variantType === 'ruled') {
    return `
      <div class="detail-option">
        <h3>Type</h3>
        <div class="variant-group variant-ruled">
          ${product.variants.map(v => `
            <button type="button" class="variant-btn ${getSelectedVariantKey() === v.key ? 'active' : ''}"
              data-variant="${v.key}">${v.label}${v.price !== product.price ? ` · ₹${v.price}` : ''}</button>`).join('')}
        </div>
      </div>`;
  }

  if (product.variantType === 'color') {
    return `
      <div class="detail-option">
        <h3>Colour — <span id="color-label">${escapeHtml(product.variants.find(v => v.key === getSelectedVariantKey())?.label || '')}</span></h3>
        <div class="variant-group variant-colors">
          ${product.variants.map(v => `
            <button type="button" class="color-swatch detail-swatch ${getSelectedVariantKey() === v.key ? 'active' : ''}"
              data-variant="${v.key}" title="${escapeAttr(v.label)}"
              style="--swatch:${v.hex || '#78716c'}"></button>`).join('')}
        </div>
        <ul class="variant-price-list">
          ${product.variants.map(v => `<li>${escapeHtml(v.label)}: ₹${v.price}</li>`).join('')}
        </ul>
      </div>`;
  }

  return '';
}

function updatePriceDisplay() {
  const price = CatalogStore.getVariantPrice(product, getSelectedVariantKey());
  document.getElementById('detail-price').textContent = `₹${price}`;
}

function renderProduct() {
  const id = getProductId();
  product = CatalogStore.getById(id);

  if (!product || product.active === false) {
    document.getElementById('product-content').classList.add('hidden');
    document.getElementById('product-not-found').classList.remove('hidden');
    document.title = 'Product not found — PageTurn Stationery';
    return;
  }

  if (product.variants?.length) selectedVariant = product.variants[0].key;

  document.title = `${product.name} — PageTurn Stationery`;
  const out = (product.stock ?? 0) <= 0;
  const price = CatalogStore.getVariantPrice(product, getSelectedVariantKey());

  document.getElementById('product-content').innerHTML = `
    <article class="product-detail">
      ${renderDetailImage(product)}
      <div class="detail-info">
        <span class="detail-category">${escapeHtml(categoryLabel(product.category))}</span>
        <h1>${escapeHtml(product.name)}</h1>
        <p class="detail-desc">${escapeHtml(product.desc)}</p>
        ${renderVariantSection()}
        <div class="detail-meta">
          <p class="detail-price" id="detail-price">₹${price}</p>
          <p class="detail-stock ${out ? 'out' : ''}">${out ? 'Out of stock' : `${product.stock} in stock${product.stock <= 5 ? ' · low stock' : ''}`}</p>
        </div>
        <div class="detail-actions">
          <button type="button" class="btn-primary btn-lg" id="detail-add-cart" ${out ? 'disabled' : ''}>
            ${out ? 'Out of stock' : 'Add to cart'}
          </button>
          <a href="index.html#products" class="btn-secondary">Continue shopping</a>
        </div>
      </div>
    </article>`;

  document.querySelectorAll('[data-variant]').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedVariant = btn.dataset.variant;
      renderProduct();
    });
  });

  document.getElementById('detail-add-cart')?.addEventListener('click', () => {
    if (addToCart(product.id, getSelectedVariantKey())) {
      const btn = document.getElementById('detail-add-cart');
      const orig = btn.textContent;
      btn.textContent = 'Added ✓';
      setTimeout(() => { btn.textContent = orig; }, 1200);
    }
  });
}

function onOrderComplete() {
  renderProduct();
}

renderProduct();
