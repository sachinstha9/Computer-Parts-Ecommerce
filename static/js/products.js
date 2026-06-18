import { updateCartCount, showCartPreview, saveCart, cart } from "./header.js";

const addButtons = document.querySelectorAll(".product-add-button");

// Add product to cart
addButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".product-section-item");
    const productName = card.querySelector(
      ".product-section-item-title",
    ).textContent;
    const productPrice = card.querySelector(
      ".product-section-item-price",
    ).textContent;
    const productImage = card.querySelector(".product-section-img");
    const computedStyle = window.getComputedStyle(productImage);
    const productImageSrc = computedStyle.backgroundImage.replace(
      /^url\(['"]?|['"]?\)$/g,
      "",
    );
    const existingProduct = cart.find((item) => item.name === productName);

    if (existingProduct) {
      existingProduct.quantity++;
    } else {
      let productUrl = productImage.href;
      let productId = productUrl.split("/");
      productId = productId[productId.length - 1];

      cart.push({
        id: productId,
        name: productName,
        price: productPrice,
        image: productImageSrc,
        quantity: 1,
      });
    }

    saveCart();
    updateCartCount();
    showCartPreview();

    button.textContent = "✓";
    button.disabled = true;

    setTimeout(() => {
      button.textContent = "✓";
      button.disabled = false;
    }, 800);
  });
});
