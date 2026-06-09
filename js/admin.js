const AUTH_KEY = 'pageturn-admin-auth';
const ADMIN_PASS = 'pageturn2026';

const loginView = document.getElementById('login-view');
const adminView = document.getElementById('admin-view');
const productForm = document.getElementById('product-form');
const variantsSection = document.getElementById('variants-section');
const variantsList = document.getElementById('variants-list');
const variantTypeSelect = document.getElementById('p-variant-type');
const formStatus = document.getElementById('form-status');

let pendingImageData = '';

function isAuthed() {
  return sessionStorage.getItem(AUTH_KEY) === '1';
}

function showAdmin() {
  loginView.classList.add('hidden');
  adminView.classList.remove('hidden');
  refresh();
}

function showLogin() {
  sessionStorage.removeItem(AUTH_KEY);
  adminView.classList.add('hidden');
  loginView.classList.remove('hidden');
}

document.getElementById('login-form').addEventListener('submit', e => {
  e.preventDefault();
  if (document.getElementById('admin-password').value === ADMIN_PASS) {
    sessionStorage.setItem(AUTH_KEY, '1');
    showAdmin();
  } else alert('Incorrect password.');
});

document.getElementById('logout-btn').addEventListener('click', showLogin);
if (isAuthed()) showAdmin();

variantTypeSelect.addEventListener('change', () => {
  const type = variantTypeSelect.value;
  variantsSection.classList.toggle('hidden', !type);
  if (type && !variantsList.children.length) addVariantRow();
});

document.getElementById('add-variant').addEventListener('click', addVariantRow);

document.getElementById('p-image-file').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 3 * 1024 * 1024) {
    showFormStatus('Image must be under 3 MB. Use a URL or smaller file.', false);
    e.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    compressImage(reader.result).then(compressed => {
      pendingImageData = compressed;
      document.getElementById('p-image-url').value = '';
      showPreview(pendingImageData);
      showFormStatus('Image ready.', true);
    });
  };
  reader.readAsDataURL(file);
});

document.getElementById('p-image-url').addEventListener('input', e => {
  pendingImageData = '';
  document.getElementById('p-image-file').value = '';
  const url = e.target.value.trim();
  if (url) showPreview(url);
  else hidePreview();
});

function compressImage(dataUrl, maxWidth = 480) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function showPreview(src) {
  const wrap = document.getElementById('image-preview-wrap');
  const img = document.getElementById('image-preview');
  img.src = src;
  wrap.classList.remove('hidden');
}

function hidePreview() {
  document.getElementById('image-preview-wrap').classList.add('hidden');
}

function showFormStatus(msg, ok) {
  formStatus.textContent = msg;
  formStatus.className = 'form-status ' + (ok ? 'ok' : 'err');
  formStatus.classList.remove('hidden');
}

function hideFormStatus() {
  formStatus.classList.add('hidden');
}

function addVariantRow(data = {}) {
  const type = variantTypeSelect.value;
  const row = document.createElement('div');
  row.className = 'variant-row';
  row.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:.5rem;margin-bottom:.5rem;align-items:end';

  if (type === 'color') {
    row.innerHTML = `
      <label style="font-size:.78rem">Key<input class="v-key" value="${escapeAttr(data.key || '')}" placeholder="blue"></label>
      <label style="font-size:.78rem">Label<input class="v-label" value="${escapeAttr(data.label || '')}" placeholder="Blue"></label>
      <label style="font-size:.78rem">Color<input type="color" class="v-hex" value="${data.hex || '#2563eb'}"></label>
      <label style="font-size:.78rem">Price ₹<input type="number" class="v-price" min="0" step="1" value="${data.price ?? ''}" placeholder="Optional"></label>
      <button type="button" class="btn-danger btn-sm v-remove">Remove</button>`;
  } else {
    row.innerHTML = `
      <label style="font-size:.78rem">Key<input class="v-key" value="${escapeAttr(data.key || '')}" placeholder="ruled"></label>
      <label style="font-size:.78rem">Label<input class="v-label" value="${escapeAttr(data.label || '')}" placeholder="Ruled"></label>
      <label style="font-size:.78rem">Price ₹<input type="number" class="v-price" min="0" step="1" value="${data.price ?? ''}" placeholder="Optional"></label>
      <button type="button" class="btn-danger btn-sm v-remove">Remove</button>`;
  }

  row.querySelector('.v-remove').addEventListener('click', () => row.remove());
  variantsList.appendChild(row);
}

function slugify(text) {
  return text.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function collectVariants(basePrice) {
  const type = variantTypeSelect.value;
  if (!type) return [];
  return [...variantsList.querySelectorAll('.variant-row')].map(row => {
    const label = row.querySelector('.v-label').value.trim();
    let key = row.querySelector('.v-key').value.trim().toLowerCase().replace(/\s+/g, '-');
    if (!key && label) key = slugify(label);
    const priceVal = row.querySelector('.v-price').value;
    const base = {
      key,
      label,
      price: priceVal !== '' ? +priceVal : basePrice,
    };
    if (type === 'color') base.hex = row.querySelector('.v-hex').value;
    return base;
  }).filter(v => v.key && v.label);
}

function renderVariantRows(variants) {
  variantsList.innerHTML = '';
  variants.forEach(v => addVariantRow(v));
}

function validateForm() {
  const name = document.getElementById('p-name').value.trim();
  const price = document.getElementById('p-price').value;
  const stock = document.getElementById('p-stock').value;

  if (!name) {
    showFormStatus('Product name is required.', false);
    document.getElementById('p-name').focus();
    return false;
  }
  if (price === '' || +price < 0) {
    showFormStatus('Enter a valid price.', false);
    document.getElementById('p-price').focus();
    return false;
  }
  if (stock === '' || +stock < 0) {
    showFormStatus('Enter a valid stock amount.', false);
    document.getElementById('p-stock').focus();
    return false;
  }

  const variantType = variantTypeSelect.value;
  if (variantType) {
    const variants = collectVariants(+price);
    if (!variants.length) {
      showFormStatus('Add at least one variant with a label, or set variant type to None.', false);
      return false;
    }
  }

  return true;
}

function refresh() {
  const products = CatalogStore.getProducts(true);
  const orders = CatalogStore.loadOrders();

  document.getElementById('stat-products').textContent = products.filter(p => p.active !== false).length;
  document.getElementById('stat-low').textContent = products.filter(p => (p.stock ?? 0) <= 5 && p.active !== false).length;
  document.getElementById('stat-orders').textContent = orders.length;

  document.getElementById('products-table').innerHTML = products.map(p => `
    <tr>
      <td>${p.image ? '🖼' : (p.emoji || '')} ${escapeHtml(p.name)}</td>
      <td>${p.category}${p.variantType ? `<br><small>${p.variantType}</small>` : ''}</td>
      <td>₹${p.price}</td>
      <td>${p.stock ?? 0}</td>
      <td>${p.active === false ? '<span class="badge badge-off">Hidden</span>' : (p.stock <= 5 ? '<span class="badge badge-low">Low</span>' : '<span class="badge badge-done">Active</span>')}</td>
      <td>
        <button type="button" class="btn-outline btn-sm" data-edit="${p.id}">Edit</button>
        <button type="button" class="btn-danger btn-sm" data-del="${p.id}">Delete</button>
      </td>
    </tr>`).join('') || '<tr><td colspan="6">No products</td></tr>';

  document.getElementById('orders-table').innerHTML = orders.map(o => `
    <tr>
      <td>${new Date(o.created).toLocaleDateString()}</td>
      <td>${escapeHtml(o.name)}<br><small>${escapeHtml(o.phone || o.email || '')}</small></td>
      <td>${escapeHtml(o.items)}</td>
      <td>₹${o.total}</td>
      <td><span class="badge ${o.status === 'done' ? 'badge-done' : 'badge-new'}">${o.status}</span></td>
      <td>${o.status !== 'done' ? `<button type="button" class="btn-outline btn-sm" data-done="${o.id}">Mark done</button>` : ''}</td>
    </tr>`).join('') || '<tr><td colspan="6">No orders yet</td></tr>';

  document.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => editProduct(+btn.dataset.edit));
  });
  document.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Delete this product?')) { CatalogStore.remove(+btn.dataset.del); resetForm(); refresh(); }
    });
  });
  document.querySelectorAll('[data-done]').forEach(btn => {
    btn.addEventListener('click', () => { CatalogStore.updateOrderStatus(+btn.dataset.done, 'done'); refresh(); });
  });
}

function editProduct(id) {
  const p = CatalogStore.getById(id);
  if (!p) return;
  hideFormStatus();
  pendingImageData = '';
  document.getElementById('product-form-title').textContent = 'Edit product';
  document.getElementById('product-id').value = p.id;
  document.getElementById('p-name').value = p.name;
  document.getElementById('p-category').value = p.category;
  document.getElementById('p-price').value = p.price;
  document.getElementById('p-stock').value = p.stock ?? 0;
  document.getElementById('p-emoji').value = p.emoji || '';
  document.getElementById('p-active').value = String(p.active !== false);
  document.getElementById('p-desc').value = p.desc || '';
  document.getElementById('p-variant-type').value = p.variantType || '';
  document.getElementById('p-image-url').value = p.image?.startsWith('data:') ? '' : (p.image || '');
  document.getElementById('p-image-file').value = '';
  if (p.image) showPreview(p.image);
  else hidePreview();
  if (p.image?.startsWith('data:')) pendingImageData = p.image;

  variantsSection.classList.toggle('hidden', !p.variantType);
  renderVariantRows(p.variants || []);
  document.getElementById('cancel-edit').classList.remove('hidden');
  document.getElementById('product-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetForm() {
  productForm.reset();
  pendingImageData = '';
  document.getElementById('product-id').value = '';
  document.getElementById('product-form-title').textContent = 'Add product';
  document.getElementById('cancel-edit').classList.add('hidden');
  variantsList.innerHTML = '';
  variantsSection.classList.add('hidden');
  hidePreview();
  hideFormStatus();
}

document.getElementById('cancel-edit').addEventListener('click', resetForm);

productForm.addEventListener('submit', async e => {
  e.preventDefault();
  hideFormStatus();

  if (!validateForm()) return;

  const idVal = document.getElementById('product-id').value;
  const urlImage = document.getElementById('p-image-url').value.trim();
  const variantType = variantTypeSelect.value || null;
  const basePrice = +document.getElementById('p-price').value;

  let image = pendingImageData || urlImage || '';

  const product = {
    id: idVal ? +idVal : CatalogStore.nextId(),
    name: document.getElementById('p-name').value.trim(),
    category: document.getElementById('p-category').value,
    price: basePrice,
    stock: +document.getElementById('p-stock').value,
    emoji: document.getElementById('p-emoji').value.trim() || '📦',
    active: document.getElementById('p-active').value === 'true',
    desc: document.getElementById('p-desc').value.trim(),
    image,
    variantType,
    variants: collectVariants(basePrice),
  };

  const saveBtn = document.getElementById('save-product-btn');
  saveBtn.disabled = true;

  try {
    CatalogStore.upsert(product);
    showFormStatus(`Product "${product.name}" saved successfully.`, true);
    resetForm();
    refresh();
  } catch (err) {
    if (image && (err.message?.includes('Storage') || err.name === 'QuotaExceededError')) {
      if (confirm('Could not save with image (storage limit). Save product without image?')) {
        product.image = '';
        try {
          CatalogStore.upsert(product);
          showFormStatus(`Product "${product.name}" saved without image.`, true);
          resetForm();
          refresh();
        } catch (err2) {
          showFormStatus(err2.message || 'Could not save product.', false);
        }
      } else {
        showFormStatus(err.message || 'Could not save product.', false);
      }
    } else {
      showFormStatus(err.message || 'Could not save product.', false);
    }
  } finally {
    saveBtn.disabled = false;
  }
});

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
