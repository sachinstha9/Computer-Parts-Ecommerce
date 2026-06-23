import { cart } from "./header.js";
import getUser from "./get-user.js";
import getProductDetails from "./get-product-details.js";
let user = (await getUser()) || {};

let total = 0;

export function updateCartCount() {
  // if (cartCount) {
  //   let totalItems = 0;
  //   cart.forEach((item) => {
  //     totalItems += (item.quantity || 0);
  //   });
  //   cartCount.textContent = totalItems;
  // }
}

export function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

let cartItemsBox = document.querySelector(".item-box");

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
      quantity: item.quantity || 1,
    };

    // If logged in, fetch live details using the database metadata ID tracking link
    if (user.loggedIn) {
      try {
        const productDetails = await getProductDetails(item.id);
        if (productDetails) {
          displayItem.name = productDetails.title || displayItem.name;
          displayItem.price = productDetails.price
            ? productDetails.price.toString().startsWith("$")
              ? productDetails.price
              : `$${productDetails.price}`
            : displayItem.price;
          displayItem.image =
            (productDetails.image && productDetails.image[0]) ||
            displayItem.image;
        }
      } catch (err) {
        console.error(
          `Error resolving cart details for item dynamic parsing ID ${item.id}:`,
          err,
        );
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
        }).catch((err) => console.error(err));
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
          body: JSON.stringify({
            id: cart[index].id,
            quantity: cart[index].quantity,
          }),
        }).catch((err) => console.error(err));
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
            body: JSON.stringify({
              id: targetItem.id,
              quantity: targetItem.quantity,
            }),
          }).catch((err) => console.error(err));
        }
      } else {
        cart.splice(index, 1);
        if (user["loggedIn"]) {
          await fetch("/remove_cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: targetItem.id }),
          }).catch((err) => console.error(err));
        }
      }

      if (!user["loggedIn"]) saveCart();
      updateCartCount();
      await showCartPreview();
    });
  }
}
updateCartCount();
showCartPreview().catch((err) => console.error(err));
if (localStorage.getItem("cart")) {
  localStorage.setItem("cart", "[]");
}

async function getTotal() {
  let total = 0;

  for (const item of cart) {
    const details = await getProductDetails(item.id);
    total += parseFloat(details.price);
  }

  return total;
}

paypal
  .Buttons({
    createOrder: async () => {
      total = await getTotal();

      const response = await fetch("/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: total,
        }),
      });

      const order = await response.json();

      console.log(order);

      return order.id;
    },

    onApprove: async (data) => {
      const response = await fetch(`/capture-order/${data.orderID}`, {
        method: "POST",
      });

      const result = await response.json();
      console.log(result);
    },
  })
  .render("#paypal-button-container");
