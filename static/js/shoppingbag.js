import { cart } from "./header.js";
import { showCartPreview as showCartPreviewHeader } from "./header.js";
import getUser from "./get-user.js";
import getProductDetails from "./get-product-details.js";

let user = (await getUser()) || {};
let cartItemsBox = document.querySelector(".checkout-products");
let cartCount = document.querySelector(".cart-count"); // Make sure this element exists in your header

// --- Cart Utility Functions ---

export function updateCartCount() {
  if (cartCount) {
    let totalItems = 0;
    cart.forEach((item) => {
      totalItems += item.quantity || 0;
    });
    cartCount.textContent = totalItems;
  }
}

export function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// Calculate total factoring in quantity and cleaning up $ strings
async function getTotal() {
  let total = 0;

  for (const item of cart) {
    let price = 0;

    if (user.loggedIn) {
      const details = await getProductDetails(item.id);
      // Remove any '$' or letters before doing math
      price = parseFloat(details.price.toString().replace(/[^0-9.]/g, ""));
    } else {
      price = parseFloat(item.price.toString().replace(/[^0-9.]/g, ""));
    }

    // Multiply by quantity!
    total += price * (item.quantity || 1);
  }

  return total;
}

// Updates the Order Summary text on the screen
async function updateOrderSummary() {
  const subtotal = await getTotal();
  const shipping = subtotal > 0 ? 10.0 : 0.0; // Adjust your shipping logic here
  const finalTotal = subtotal + shipping;

  document.getElementById("dom-subtotal").textContent =
    `$${subtotal.toFixed(2)}`;
  document.getElementById("dom-shipping").textContent =
    `$${shipping.toFixed(2)}`;
  document.getElementById("dom-total").textContent =
    `$${finalTotal.toFixed(2)}`;

  return finalTotal;
}

// --- Cart Rendering ---

export async function showCartPreview() {
  if (!cartItemsBox) return;
  cartItemsBox.innerHTML = "";

  // Inside your showCartPreview() function:
  if (!cart || cart.length === 0) {
    cartItemsBox.innerHTML = `<p class="empty-checkout-message">Your shopping cart is currently empty.</p>`;
    await updateOrderSummary();
    return;
  }
  for (const [index, item] of cart.entries()) {
    if (!item) continue;

    let displayItem = {
      id: item.id,
      name: item.name || "Loading Product...",
      price: item.price || "$0.00",
      image: item.image || "/images/placeholder.png",
      quantity: item.quantity || 1,
    };

    if (user.loggedIn) {
      try {
        const productDetails = await getProductDetails(item.id);
        if (productDetails) {
          displayItem.name = productDetails.title || displayItem.name;
          displayItem.price = productDetails.price?.toString().startsWith("$")
            ? productDetails.price
            : `$${productDetails.price}`;
          displayItem.image = productDetails.image?.[0] || displayItem.image;
        }
      } catch (err) {
        console.error(`Error resolving details for ID ${item.id}:`, err);
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

    // Event Listeners for Buttons
    cartItem
      .querySelector(".remove-cart-item")
      .addEventListener("click", async (e) => {
        e.stopPropagation();
        const targetItem = cart[index];
        cart.splice(index, 1);

        if (user.loggedIn) {
          await fetch("/remove_cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: targetItem.id }),
          }).catch(console.error);
        } else {
          saveCart();
        }

        updateCartCount();
        await showCartPreview();
      });

    cartItem
      .querySelector(".mini-increase")
      .addEventListener("click", async (e) => {
        e.stopPropagation();
        cart[index].quantity++;

        if (user.loggedIn) {
          await fetch("/add_cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: cart[index].id,
              quantity: cart[index].quantity,
            }),
          }).catch(console.error);
        } else {
          saveCart();
        }

        updateCartCount();
        await showCartPreview();
      });

    cartItem
      .querySelector(".mini-decrease")
      .addEventListener("click", async (e) => {
        e.stopPropagation();
        const targetItem = cart[index];

        if (targetItem.quantity > 1) {
          targetItem.quantity--;
          if (user.loggedIn) {
            await fetch("/add_cart", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: targetItem.id,
                quantity: targetItem.quantity,
              }),
            }).catch(console.error);
          }
        } else {
          cart.splice(index, 1);
          if (user.loggedIn) {
            await fetch("/remove_cart", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: targetItem.id }),
            }).catch(console.error);
          }
        }

        if (!user.loggedIn) saveCart();
        updateCartCount();
        await showCartPreview();
      });
  }

  // Refresh Order Summary every time the cart UI re-renders
  await updateOrderSummary();
}

// Initialization
updateCartCount();
showCartPreview().catch(console.error);

// --- PayPal Integration ---

paypal
  .Buttons({
    // Require the terms checkbox to be checked before showing PayPal UI
    onInit: function (data, actions) {
      const termsCheckbox = document.getElementById("terms-checkbox");
      if (termsCheckbox) {
        actions.disable(); // Disabled by default

        termsCheckbox.addEventListener("change", function (event) {
          if (event.target.checked) {
            actions.enable();
          } else {
            actions.disable();
          }
        });
      }
    },

    // Alert user if they try to click it while disabled
    onClick: function () {
      const termsCheckbox = document.getElementById("terms-checkbox");
      if (termsCheckbox && !termsCheckbox.checked) {
        alert(
          "Please agree to the Terms and Conditions to proceed with checkout.",
        );
      }
    },

    createOrder: async () => {
      // Get the final total including shipping
      const finalAmount = await updateOrderSummary();

      const response = await fetch("/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount }),
      });

      const order = await response.json();
      console.log("Order created:", order);
      return order.id;
    },

    onApprove: async (data) => {
      try {
        const response = await fetch(`/capture-order/${data.orderID}`, {
          method: "POST",
        });

        const result = await response.json();
        console.log("Payment captured:", result);

        // 1. Clear the frontend cart array and update localStorage/UI
        cart.length = 0; // Empties the array without breaking the reference
        saveCart();
        updateCartCount();
        showCartPreviewHeader();

        // 2. Hide the main checkout grid so the user can't interact with it anymore
        const checkoutContainer = document.querySelector(".checkout-container");
        if (checkoutContainer) {
          checkoutContainer.style.display = "none";
        }

        // 3. Create and show the success message
        const mainPage = document.querySelector(".checkout-page");
        const successDiv = document.createElement("div");
        successDiv.className = "success-message-box";

        // We use result.id if available, otherwise fallback to the data.orderID
        const transactionId = result.id || data.orderID;

        successDiv.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
          <h2 style="color: #28a745; margin-bottom: 15px;">🎉 Payment Successful!</h2>
          <p style="font-size: 1.1rem; margin-bottom: 10px;">Thank you for your order.</p>
          <p style="color: #555; margin-bottom: 30px;">Your transaction ID is: <strong>${transactionId}</strong></p>
          <a href="/" style="display: inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 5px;">Continue Shopping</a>
        </div>
      `;

        mainPage.appendChild(successDiv);
      } catch (error) {
        console.error("Error capturing payment:", error);
        alert(
          "There was an issue processing your payment on our end. Please contact support.",
        );
      }
    },
  })
  .render("#paypal-button-container");
