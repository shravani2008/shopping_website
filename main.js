// public/js/main.js
// Cart stored as array of { _id, name, price, image, qty }

function getCart() {
  try {
    return JSON.parse(localStorage.getItem('cart')) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// add product to cart (called from product button)
function addToCart(id, name, price, image) {
  const cart = getCart();
  const idx = cart.findIndex(item => item._id === id);
  if (idx > -1) {
    cart[idx].qty += 1;
  } else {
    cart.push({ _id: id, name, price: Number(price), image, qty: 1 });
  }
  saveCart(cart);
  showToast(`${name} added to cart`);
  updateCartCount();
}

// remove item completely
function removeFromCart(id) {
  let cart = getCart();
  cart = cart.filter(item => item._id !== id);
  saveCart(cart);
  renderCartPage();
  updateCartCount();
}

// change quantity (+/-)
function updateQty(id, qty) {
  const cart = getCart();
  const idx = cart.findIndex(i => i._id === id);
  if (idx > -1) {
    cart[idx].qty = Math.max(1, Number(qty));
    saveCart(cart);
    renderCartPage();
    updateCartCount();
  }
}

// compute total
function cartTotal() {
  const cart = getCart();
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

// show simple toast (temporary)
function showToast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style = 'position:fixed;right:20px;bottom:20px;background:#198754;color:#fff;padding:10px 14px;border-radius:6px;z-index:9999;box-shadow:0 6px 18px rgba(0,0,0,.15)';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
}

// update cart count in navbar
function updateCartCount() {
  const el = document.getElementById('cartCount');
  if (!el) return;
  const cart = getCart();
  const totalQty = cart.reduce((s,i) => s + i.qty, 0);
  el.textContent = totalQty;
}

// render cart page (if on /cart)
function renderCartPage() {
  const container = document.getElementById('cartContainer');
  if (!container) return;
  const cart = getCart();
  if (cart.length === 0) {
    container.innerHTML = '<p>Your cart is empty.</p><a href="/" class="btn btn-primary">Go shopping</a>';
    document.getElementById('cartTotal').textContent = '₹0';
    return;
  }
  container.innerHTML = '';
  cart.forEach(item => {
    const div = document.createElement('div');
    div.className = 'd-flex align-items-center mb-3';
    div.innerHTML = `
      <img src="${item.image || '/images/placeholder.png'}" style="width:80px;height:80px;object-fit:cover;border-radius:6px;margin-right:12px" />
      <div style="flex:1">
        <strong>${item.name}</strong><br/>
        <small>₹${item.price} × </small>
        <input type="number" min="1" value="${item.qty}" style="width:70px" onchange="updateQty('${item._id}', this.value)" />
      </div>
      <div style="min-width:120px;text-align:right">
        <div>₹${(item.price * item.qty).toFixed(2)}</div>
        <button class="btn btn-sm btn-outline-danger mt-2" onclick="removeFromCart('${item._id}')">Remove</button>
      </div>
    `;
    container.appendChild(div);
  });
  document.getElementById('cartTotal').textContent = `₹${cartTotal().toFixed(2)}`;
}

// run on page load
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  renderCartPage();
});
