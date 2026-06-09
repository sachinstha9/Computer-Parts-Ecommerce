import { updateCartCount, showCartPreview, saveCart, cart } from "./header.js";

const btnAddToCart = document.querySelector("#add-to-cart");

const wishListAddButton = document.querySelector(
  "#product-view-title-wrapper button",
);
const wishListAddButtonIcon = document.querySelector(
  "#product-view-title-wrapper button i",
);

btnAddToCart.addEventListener("click", () => {
  const productName = document.querySelector("#product-view-title").textContent;
  const productPrice = document.querySelector(
    "#product-view-price",
  ).textContent;
  const productImage = document.querySelector("#product-view-img-src");
  const computedStyle = window.getComputedStyle(productImage);
  const productImageSrc = computedStyle.backgroundImage.replace(
    /^url\(['"]?|['"]?\)$/g,
    "",
  );
  const existingProduct = cart.find((item) => item.name === productName);

  if (existingProduct) {
    existingProduct.quantity++;
  } else {
    cart.push({
      name: productName,
      price: productPrice,
      image: productImageSrc,
      quantity: 1,
    });
  }

  saveCart();
  updateCartCount();
  showCartPreview();

  btnAddToCart.innerHTML =
    '<i class="fa fa-check" aria-hidden="true"></i> Added to Cart';
  btnAddToCart.disabled = true;

  setTimeout(() => {
    btnAddToCart.innerHTML =
      '<i class="fa fa-shopping-cart" aria-hidden="true"></i> Add to Cart';
    btnAddToCart.disabled = false;
  }, 800);
});

wishListAddButton.addEventListener("click", () => {
  if (wishListAddButtonIcon.classList.contains("fa-heart-o")) {
    wishListAddButtonIcon.classList.remove("fa-heart-o");
    wishListAddButtonIcon.classList.add("fa-heart");
    wishListAddButtonIcon.classList.add("add-red");
  } else {
    wishListAddButtonIcon.classList.remove("fa-heart");
    wishListAddButtonIcon.classList.remove("add-red");
    wishListAddButtonIcon.classList.add("fa-heart-o");
  }
});
