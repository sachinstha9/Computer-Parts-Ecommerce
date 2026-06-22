import { updateCartCount, showCartPreview, saveCart, cart } from "./header.js";
import getUser from "./get-user.js";

// Fetch current user session state
const user = (await getUser()) || {};
const addButtons = document.querySelectorAll(".product-add-button");

addButtons.forEach((button) => {
  // Made the listener async to handle the header's async cart preview cleanly
  button.addEventListener("click", async () => {
    const card = button.closest(".product-section-item");
    const productName = card.querySelector(".product-section-item-title").textContent;
    const productPrice = card.querySelector(".product-section-item-price").textContent;
    const productImage = card.querySelector(".product-section-img");
    
    // Extract product ID first so we can check the cart reliably
    let productUrl = productImage.href;
    let productIdArr = productUrl.split("/");
    const prodId = productIdArr[productIdArr.length - 1];

    const computedStyle = window.getComputedStyle(productImage);
    const productImageSrc = computedStyle.backgroundImage.replace(
      /^url\(['"]?|['"]?\)$/g,
      "",
    );

    // FIX: Match by item.id because database items don't have a name property natively
    const existingProduct = cart.find((item) => String(item.id) === String(prodId));

    if (existingProduct) {
      existingProduct.quantity++;

      if (user["loggedIn"]) {
        await fetch("/add_cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: prodId,
            quantity: existingProduct.quantity,
          }),
        }).catch((err) => console.error("Error updating cart quantity:", err));
      }
    } else {
      cart.push({
        id: prodId,
        name: productName,
        price: productPrice,
        image: productImageSrc,
        quantity: 1,
      });

      if (user["loggedIn"]) {
        await fetch("/add_cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: prodId,
            quantity: 1,
          }),
        }).catch((err) => console.error("Error adding item to cart:", err));
      }
    }

    // Only commit to localStorage if the visitor is a guest
    if (!user["loggedIn"]) {
      saveCart();
    }
    
    updateCartCount();
    await showCartPreview();

    button.textContent = "✓";
    button.disabled = true;

    setTimeout(() => {
      button.textContent = "✓";
      button.disabled = false;
    }, 800);
  });
});