export let cart = JSON.parse(localStorage.getItem("cart")) || [];
export let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

const cartCount = document.querySelector(".cart-count");
const cartIcon = document.querySelector(".cart-icon");
const cartDropdown = document.querySelector(".cart-dropdown");
const cartItemsBox = document.querySelector(".cart-items");

const wishlistCount = document.querySelector(".wishlist-count");
const wishlistIcon = document.querySelector(".wishlist-icon");
const wishlistDropdown = document.querySelector(".wishlist-dropdown");
const wishlistItemsBox = document.querySelector(".wishlist-items");

export function updateCartCount() {
  if (cartCount) {
    let totalItems = 0;

    cart.forEach((item) => {
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

  removeButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();

      const itemIndex = button.dataset.index;

      cart.splice(itemIndex, 1);

      saveCart();
      updateCartCount();
      showCartPreview();
    });
  });

  increaseButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();

      const itemIndex = button.dataset.index;

      cart[itemIndex].quantity++;

      saveCart();
      updateCartCount();
      showCartPreview();
    });
  });

  decreaseButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
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

export function updateWishlistCount() {
  if (wishlistCount) {
    let totalItems = 0;

    wishlist.forEach((item) => {
      totalItems += 1;
    });

    wishlistCount.textContent = totalItems;
  }
}

// Wishlist
export function saveWishlist() {
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
}

export function showWishlistPreview() {
  if (!wishlistItemsBox) return;

  wishlistItemsBox.innerHTML = "";

  if (wishlist.length === 0) {
    wishlistItemsBox.innerHTML = `
      <p class="empty-wishlist-message">
        Your wishlist is empty.
      </p>
    `;

    return;
  }

  wishlist.forEach((item, index) => {
    const wishlistItem = document.createElement("div");
    wishlistItem.classList.add("wishlist-preview-item");

    wishlistItem.innerHTML = `
      <a href="/productview/${item.id}">
        <img src="${item.image}" alt="${item.name}">
      </a>

      <div class="wishlist-preview-info">
        <p>${item.name}</p>

        <div class="wishlist-preview-bottom">
          <strong>${item.price}</strong>
        </div>
      </div>

      <button class="remove-wishlist-item" data-index="${index}">
        ×
      </button>
    `;

    wishlistItemsBox.appendChild(wishlistItem);
  });

  const removeButtons = document.querySelectorAll(".remove-wishlist-item");

  removeButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();

      const itemIndex = button.dataset.index;

      wishlist.splice(itemIndex, 1);

      saveWishlist();
      updateWishlistCount();
      showWishlistPreview();
    });
  });
}

updateWishlistCount();
showWishlistPreview();

if (wishlistIcon && wishlistDropdown) {
  wishlistIcon.addEventListener("click", () => {
    wishlistDropdown.classList.toggle("open");
  });
}
