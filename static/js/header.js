import getUser from "./get-user.js";
import getProductDetails from "./get-product-details.js";

let user = (await getUser()) || {};

export let cart = JSON.parse(localStorage.getItem("cart")) || [];

export let wishlist;

if (!user["loggedIn"]) {
  wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
} else {
  wishlist = user["wishlist"];
}

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
      <a href="/productview/${item.id}">
        <img src="${item.image}" alt="${item.name}">
      </a>

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

export async function showWishlistPreview() {
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

  for (const [index, item] of wishlist.entries()) {
    const wishlistItem = document.createElement("div");
    wishlistItem.classList.add("wishlist-preview-item");

    let productDetails = item;

    if (user.loggedIn) {
      productDetails = await getProductDetails(item);
    }

    wishlistItem.innerHTML = `
      <a href="/productview/${productDetails.id}" class="wishlist-image-wrapper">
        <img src="${productDetails.image[0]}" alt="${productDetails.title}">
      </a>

      <div class="wishlist-preview-info">
        <p>${productDetails.title}</p>

        <div class="wishlist-preview-bottom">
          <strong>$${productDetails.price}</strong>
        </div>
      </div>

      <button class="remove-wishlist-item" data-index="${index}">
        ×
      </button>
    `;

    wishlistItemsBox.appendChild(wishlistItem);

    const removeButton = wishlistItem.querySelector(".remove-wishlist-item");

    removeButton.addEventListener("click", async (event) => {
      event.stopPropagation();

      if (!user.loggedIn) {
        wishlist.splice(index, 1);
        saveWishlist();
      } else {
        const response = await fetch("/remove_wishlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: productDetails.id,
          }),
        });

        if (response.ok) {
          wishlist.splice(index, 1);
        }
      }

      updateWishlistCount();
      showWishlistPreview();
    });
  }
}

updateWishlistCount();
showWishlistPreview();

if (wishlistIcon && wishlistDropdown) {
  wishlistIcon.addEventListener("click", () => {
    wishlistDropdown.classList.toggle("open");
  });
}
