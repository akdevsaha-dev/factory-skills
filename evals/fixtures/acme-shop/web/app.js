const list = document.querySelector('#products');
const status = document.querySelector('#status');
const token = 'token-alice';

async function loadProducts() {
  const response = await fetch('/api/products');
  if (!response.ok) {
    status.textContent = 'Could not load products.';
    status.setAttribute('role', 'alert');
    return;
  }
  const products = await response.json();
  status.textContent = products.length ? '' : 'No products yet.';
  list.replaceChildren(...products.map(renderProduct));
}

function renderProduct(product) {
  const item = document.createElement('li');
  const label = document.createElement('span');
  label.textContent = `${product.name} — $${product.price}`;
  const button = document.createElement('button');
  button.textContent = 'Order';
  button.addEventListener('click', () => placeOrder(product.id, button));
  item.append(label, button);
  return item;
}

async function placeOrder(productId, button) {
  button.disabled = true;
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ productId, quantity: 1 }),
  });
  button.disabled = false;
  status.textContent = response.ok ? 'Order placed.' : (await response.json()).error;
}

loadProducts();
