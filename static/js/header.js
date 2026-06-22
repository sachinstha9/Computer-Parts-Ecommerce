import getUser from "./get-user.js";
import getProductDetails from "./get-product-details.js";

let user = {};
export let cart = [];
export let wishlist = [];

// Helper safe JSON parser for localStorage
function safeParse(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (e) {
    console.error(`Error parsing localStorage key "${key}":`, e);
    return [];
  }
}

// Global runtime session initialization
try {
  user = (await getUser()) || {};
  
  if (!user["loggedIn"]) {
    cart = safeParse("cart");
    wishlist = safeParse("wishlist");
  } else {
    // Type checking handles strings from SQLite/Python or pre-parsed arrays
    let dbCart = user["cart"] || [];
    cart = typeof dbCart === "string" ? JSON.parse(dbCart || "[]") : dbCart;

    let dbWishlist = user["wishlist"] || [];
    wishlist = typeof dbWishlist === "string" ? JSON.parse(dbWishlist || "[]") : dbWishlist;
  }
} catch (error) {
  console.error("Failed to initialize user session state:", error);
}

// DOM Elements Selection
const cartCount = document.querySelector(".cart-count");
const cartIcon = document.querySelector(".cart-icon");
const cartDropdown = document.querySelector(".cart-dropdown");
const cartItemsBox = document.querySelector(".cart-items");

const wishlistCount = document.querySelector(".wishlist-count");
const wishlistIcon = document.querySelector(".wishlist-icon");
const wishlistDropdown = document.querySelector(".wishlist-dropdown");
const wishlistItemsBox = document.querySelector(".wishlist-items");


// ==========================================
// --- CART MANAGEMENT SYSTEM ---
// ==========================================

export function updateCartCount() {
  if (cartCount) {
    let totalItems = 0;
    cart.forEach((item) => {
      totalItems += (item.quantity || 0);
    });
    cartCount.textContent = totalItems;
  }
}

export function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

export async function showCartPreview() {
  if (!cartItemsBox) return;
  cartItemsBox.innerHTML = "";

  if (!cart || cart.length === 0) {
    cartItemsBox.innerHTML = `<p class="empty-cart-message">Your cart is empty.</p>`;
    return;
  }

  // Linear iteration allows clean execution blocking via async/await loops
  for (const [index, item] of cart.entries()) {
    if (!item) continue;

    // Local configuration adapter template fallback
    let displayItem = {
      id: item.id,
      name: item.name || "Loading Product...",
      price: item.price || "$0.00",
      image: item.image || "/images/placeholder.png",
      quantity: item.quantity || 1
    };

    // If logged in, fetch live details using the database metadata ID tracking link
    if (user.loggedIn) {
      try {
        const productDetails = await getProductDetails(item.id);
        if (productDetails) {
          displayItem.name = productDetails.title || displayItem.name;
          displayItem.price = productDetails.price 
            ? (productDetails.price.toString().startsWith('$') ? productDetails.price : `$${productDetails.price}`) 
            : displayItem.price;
          displayItem.image = (productDetails.image && productDetails.image[0]) || displayItem.image;
        }
      } catch (err) {
        console.error(`Error resolving cart details for item dynamic parsing ID ${item.id}:`, err);
      }
    }

    const cartItem = document.createElement("div");
    cartItem.classList.add("cart-preview-item");
    cartItem.innerHTML = `
      <a href="/productview/${displayItem.id}">
        <img src="${displayItem.image}" alt="${displayItem.name}">
      </a>
      <div class="cart-preview-info">
        <p>${displayItem.name}</p>
        <div class="cart-preview-bottom">
          <strong>${displayItem.price}</strong>
          <div class="mini-quantity-controls">
            <button class="mini-decrease">-</button>
            <span>${displayItem.quantity}</span>
            <button class="mini-increase">+</button>
          </div>
        </div>
      </div>
      <button class="remove-cart-item">×</button>
    `;

    cartItemsBox.appendChild(cartItem);

    // Contextually target and couple listeners locally inside creation scope
    const removeButton = cartItem.querySelector(".remove-cart-item");
    const increaseButton = cartItem.querySelector(".mini-increase");
    const decreaseButton = cartItem.querySelector(".mini-decrease");

    // Click Actions: Delete record completely
    removeButton.addEventListener("click", async (event) => {
      event.stopPropagation();
      const targetItem = cart[index];
      cart.splice(index, 1);

      if (user["loggedIn"]) {
        await fetch("/remove_cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: targetItem.id }),
        }).catch(err => console.error(err));
      } else {
        saveCart();
      }
      updateCartCount();
      await showCartPreview();
    });

    // Click Actions: Quantity Increment modification
    increaseButton.addEventListener("click", async (event) => {
      event.stopPropagation();
      cart[index].quantity++;

      if (user["loggedIn"]) {
        await fetch("/add_cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: cart[index].id, quantity: cart[index].quantity }),
        }).catch(err => console.error(err));
      } else {
        saveCart();
      }
      updateCartCount();
      await showCartPreview();
    });

    // Click Actions: Quantity Decrement modification
    decreaseButton.addEventListener("click", async (event) => {
      event.stopPropagation();
      const targetItem = cart[index];

      if (targetItem.quantity > 1) {
        targetItem.quantity--;
        if (user["loggedIn"]) {
          await fetch("/add_cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: targetItem.id, quantity: targetItem.quantity }),
          }).catch(err => console.error(err));
        }
      } else {
        cart.splice(index, 1);
        if (user["loggedIn"]) {
          await fetch("/remove_cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: targetItem.id }),
          }).catch(err => console.error(err));
        }
      }

      if (!user["loggedIn"]) saveCart();
      updateCartCount();
      await showCartPreview();
    });
  }
}


// ==========================================
// --- WISHLIST MANAGEMENT SYSTEM ---
// ==========================================

export function updateWishlistCount() {
  if (wishlistCount) {
    wishlistCount.textContent = wishlist ? wishlist.length : 0;
  }
}

export function saveWishlist() {
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
}

export async function showWishlistPreview() {
  if (!wishlistItemsBox) return;
  wishlistItemsBox.innerHTML = "";

  if (!wishlist || wishlist.length === 0) {
    wishlistItemsBox.innerHTML = `<p class="empty-wishlist-message">Your wishlist is empty.</p>`;
    return;
  }

  for (const [index, item] of wishlist.entries()) {
    if (!item) continue;
    
    let productDetails = item;

    if (user.loggedIn) {
      try {
        productDetails = await getProductDetails(item);
        if (!productDetails) continue; 
      } catch (err) {
        console.error(`Error resolving wishlist item details for mapping configuration ID ${item}:`, err);
        continue;
      }
    }

    const displayPrice = productDetails.price 
      ? (productDetails.price.toString().startsWith('$') ? productDetails.price : `$${productDetails.price}`) 
      : "$0.00";
    
    const displayImg = (productDetails.image && productDetails.image[0]) || "/images/placeholder.png";
    const displayTitle = productDetails.title || "Unknown Product";

    const wishlistItem = document.createElement("div");
    wishlistItem.classList.add("wishlist-preview-item");
    wishlistItem.innerHTML = `
      <a href="/productview/${productDetails.id || item}" class="wishlist-image-wrapper">
        <img src="${displayImg}" alt="${displayTitle}">
      </a>
      <div class="wishlist-preview-info">
        <p>${displayTitle}</p>
        <div class="wishlist-preview-bottom">
          <strong>${displayPrice}</strong>
        </div>
      </div>
      <button class="remove-wishlist-item">×</button>
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: productDetails.id || item }),
        }).catch(err => console.error(err));

        if (response && response.ok) {
          wishlist.splice(index, 1);
        }
      }

      updateWishlistCount();
      await showWishlistPreview();
    });
  }
}


// ==========================================
// --- RUNTIME INTERFACE INITIALIZATION ---
// ==========================================

try {
  updateCartCount();
  showCartPreview().catch(err => console.error(err));
  
  updateWishlistCount();
  showWishlistPreview().catch(err => console.error(err));
} catch (error) {
  console.error("Runtime component display execution error:", error);
}

// Toggle Dropdown Panel Visual Visibility
if (cartIcon && cartDropdown) {
  cartIcon.addEventListener("click", () => cartDropdown.classList.toggle("open"));
}
if (wishlistIcon && wishlistDropdown) {
  wishlistIcon.addEventListener("click", () => wishlistDropdown.classList.toggle("open"));
}