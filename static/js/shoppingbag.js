// Get the saved cart from localStorage
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Select page elements
const checkoutProducts = document.querySelector(".checkout-products");
const cartCount = document.querySelector(".cart-count");
const subtotalText = document.querySelector(".subtotal-price");
const shippingText = document.querySelector(".shipping-price");
const totalText = document.querySelector(".total-price");

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartCount() {
  let totalItems = 0;

  cart.forEach(item => {
    totalItems += item.quantity;
  });

  cartCount.textContent = totalItems;
}

function getPriceNumber(priceText) {
  return Number(priceText.replace("$", "").replace(",", ""));
}

function renderShoppingCart() {
  checkoutProducts.innerHTML = "";

  if (cart.length === 0) {
    checkoutProducts.innerHTML = `
      <p class="empty-checkout-message">
        Your shopping cart is currently empty.
      </p>
    `;

    subtotalText.textContent = "$0.00";
    shippingText.textContent = "$0.00";
    totalText.textContent = "$0.00";

    updateCartCount();
    return;
  }

  let subtotal = 0;

  cart.forEach((item, index) => {
    const price = getPriceNumber(item.price);
    subtotal += price * item.quantity;

    const cartProduct = document.createElement("article");
    cartProduct.classList.add("checkout-product");

    cartProduct.innerHTML = `
      <img src="${item.image}" alt="${item.name}">

      <div class="checkout-product-info">
        <h3>${item.name}</h3>

        <p>${item.price}</p>

        <div class="quantity-controls">
          <button class="quantity-btn decrease" data-index="${index}">
            -
          </button>

          <span class="quantity-value">${item.quantity}</span>

          <button class="quantity-btn increase" data-index="${index}">
            +
          </button>
        </div>

        <button class="remove-product" data-index="${index}">
          Remove
        </button>
      </div>
    `;

    checkoutProducts.appendChild(cartProduct);
  });

  const shipping = 12.99;
  const total = subtotal + shipping;

  subtotalText.textContent = "$" + subtotal.toFixed(2);
  shippingText.textContent = "$" + shipping.toFixed(2);
  totalText.textContent = "$" + total.toFixed(2);

  const removeButtons = document.querySelectorAll(".remove-product");
  const increaseButtons = document.querySelectorAll(".increase");
  const decreaseButtons = document.querySelectorAll(".decrease");

  removeButtons.forEach(button => {
    button.addEventListener("click", () => {
      const itemIndex = button.dataset.index;

      cart.splice(itemIndex, 1);

      saveCart();
      renderShoppingCart();
    });
  });

  increaseButtons.forEach(button => {
    button.addEventListener("click", () => {
      const itemIndex = button.dataset.index;

      cart[itemIndex].quantity++;

      saveCart();
      renderShoppingCart();
    });
  });

  decreaseButtons.forEach(button => {
    button.addEventListener("click", () => {
      const itemIndex = button.dataset.index;

      if (cart[itemIndex].quantity > 1) {
        cart[itemIndex].quantity--;
      } else {
        cart.splice(itemIndex, 1);
      }

      saveCart();
      renderShoppingCart();
    });
  });

  updateCartCount();
}

renderShoppingCart();