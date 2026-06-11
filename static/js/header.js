export let cart = JSON.parse(localStorage.getItem("cart")) || [];
export let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

const cartCount = document.querySelector(".cart-count");
const cartIcon = document.querySelector(".cart-icon");
const cartDropdown = document.querySelector(".cart-dropdown");
const cartItemsBox = document.querySelector(".cart-items");

export function updateCartCount() {
  if (cartCount) {
    cartCount.textContent = cart.length;
  }
}

export function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

export function showCartPreview() {
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
                <strong>${item.price}</strong>
                <small>Qty: ${item.quantity}</small>
            </div>

            <button class="remove-cart-item" data-index="${index}">
                ×
            </button>
        `;

    cartItemsBox.appendChild(cartItem);
  });

  const removeButtons = document.querySelectorAll(".remove-cart-item");

  removeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const itemIndex = button.dataset.index;

      cart.splice(itemIndex, 1);

      saveCart();
      updateCartCount();
      showCartPreview();
    });
  });
}

updateCartCount();
showCartPreview();

// Toggle cart dropdown
cartIcon.addEventListener("click", () => {
  cartDropdown.classList.toggle("open");
});

// Wishlist
export function saveWishlist() {
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
}

saveWishlist();
