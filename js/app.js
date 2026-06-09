let activeFilter = 'all';
let searchQuery = '';

const grid = document.getElementById('product-grid');

function getProducts() {
  return CatalogStore.getProducts();
}

function renderProductImage(p, compact = true) {
  if (p.image) {
    return `<div class="product-img product-img-photo">
      <img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <span class="product-img-fallback">${p.emoji || '📦'}</span>
    </div>`;
  }
  return `<div class="product-img">${p.emoji || '📦'}</div>`;
}

function matchesSearch(product, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  const haystack = [
    product.name,
    product.desc,
    product.category,
    ...(product.variants || []).map(v => v.label),
  ].join(' ').toLowerCase();
  return haystack.includes(q);
}

function variantHint(p) {
  if (!p.variants?.length) return '';
  if (p.variantType === 'color') return `${p.variants.length} colours available`;
  if (p.variantType === 'ruled') return 'Ruled & unruled options';
  return `${p.variants.length} options`;
}

function renderProducts() {
  const products = getProducts();
  let filtered = activeFilter === 'all' ? products : products.filter(p => p.category === activeFilter);
  filtered = filtered.filter(p => matchesSearch(p, searchQuery));

  grid.innerHTML = filtered.length ? filtered.map(p => {
    const out = (p.stock ?? 0) <= 0;
    const hint = variantHint(p);
    const priceFrom = p.variants?.length
      ? Math.min(...p.variants.map(v => v.price ?? p.price))
      : p.price;
    const priceLabel = p.variants?.length && priceFrom !== p.price ? `From ₹${priceFrom}` : `₹${p.price}`;

    return `
    <article class="product-card" data-cat="${p.category}">
      <a href="product.html?id=${p.id}" class="product-card-link">
        ${renderProductImage(p)}
        <div class="product-body">
          <h3>${escapeHtml(p.name)}</h3>
          <p>${escapeHtml(p.desc)}</p>
          ${hint ? `<p class="variant-hint">${escapeHtml(hint)}</p>` : ''}
          <div class="product-footer">
            <span class="price">${priceLabel}${p.stock <= 5 && !out ? ' · low stock' : ''}</span>
            <span class="view-link">View details →</span>
          </div>
        </div>
      </a>
      <button class="add-cart quick-add" data-id="${p.id}" ${out ? 'disabled' : ''} title="Quick add default option">
        ${out ? 'Out of stock' : '+ Quick add'}
      </button>
    </article>`;
  }).join('') : `<p class="empty-grid">${searchQuery ? `No products found for "${escapeHtml(searchQuery)}"` : 'No products in this category.'}</p>`;

  grid.querySelectorAll('.quick-add:not([disabled])').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const p = CatalogStore.getById(+btn.dataset.id);
      const variantKey = p.variants?.length ? p.variants[0].key : null;
      if (addToCart(+btn.dataset.id, variantKey)) {
        btn.textContent = 'Added ✓';
        setTimeout(() => { btn.textContent = '+ Quick add'; }, 1000);
      }
    });
  });
}

function onOrderComplete() {
  renderProducts();
}

document.querySelectorAll('.filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.filter.active')?.classList.remove('active');
    btn.classList.add('active');
    activeFilter = btn.dataset.cat;
    renderProducts();
  });
});

const searchInput = document.getElementById('product-search');
const searchClear = document.getElementById('search-clear');

searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value.trim();
  searchClear.classList.toggle('hidden', !searchQuery);
  renderProducts();
});

searchClear.addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  searchClear.classList.add('hidden');
  searchInput.focus();
  renderProducts();
});

renderProducts();
