export let cart = JSON.parse(localStorage.getItem("cart")) || [];
export let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

const cartCount = document.querySelector(".cart-count");
const cartIcon = document.querySelector(".cart-icon");
const cartDropdown = document.querySelector(".cart-dropdown");
const cartItemsBox = document.querySelector(".cart-items");

export function updateCartCount() {
  if (cartCount) {
    let totalItems = 0;

    cart.forEach(item => {
      totalItems += item.quantity;
    });

    cartCount.textContent = totalItems;
  }
}

export function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

export function showCartPreview() {
  if (!cartItemsBox) return;

  cartItemsBox.innerHTML = "";

  if (cart.length === 0) {
    cartItemsBox.innerHTML = `
      <p class="empty-cart-message">
        Your cart is empty.
      </p>
    `;

    return;
  }

  cart.forEach((item, index) => {
    const cartItem = document.createElement("div");
    cartItem.classList.add("cart-preview-item");

    cartItem.innerHTML = `
      <img src="${item.image}" alt="${item.name}">

      <div class="cart-preview-info">
        <p>${item.name}</p>

        <div class="cart-preview-bottom">
          <strong>${item.price}</strong>

          <div class="mini-quantity-controls">
            <button class="mini-decrease" data-index="${index}">
              -
            </button>

            <span>${item.quantity}</span>

            <button class="mini-increase" data-index="${index}">
              +
            </button>
          </div>
        </div>
      </div>

      <button class="remove-cart-item" data-index="${index}">
        ×
      </button>
    `;

    cartItemsBox.appendChild(cartItem);
  });

  const removeButtons = document.querySelectorAll(".remove-cart-item");
  const increaseButtons = document.querySelectorAll(".mini-increase");
  const decreaseButtons = document.querySelectorAll(".mini-decrease");

  removeButtons.forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();

      const itemIndex = button.dataset.index;

      cart.splice(itemIndex, 1);

      saveCart();
      updateCartCount();
      showCartPreview();
    });
  });

  increaseButtons.forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();

      const itemIndex = button.dataset.index;

      cart[itemIndex].quantity++;

      saveCart();
      updateCartCount();
      showCartPreview();
    });
  });

  decreaseButtons.forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();

      const itemIndex = button.dataset.index;

      if (cart[itemIndex].quantity > 1) {
        cart[itemIndex].quantity--;
      } else {
        cart.splice(itemIndex, 1);
      }

      saveCart();
      updateCartCount();
      showCartPreview();
    });
  });
}

updateCartCount();
showCartPreview();

// Toggle cart dropdown
if (cartIcon && cartDropdown) {
  cartIcon.addEventListener("click", () => {
    cartDropdown.classList.toggle("open");
  });
}

// Wishlist
export function saveWishlist() {
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
}

saveWishlist();