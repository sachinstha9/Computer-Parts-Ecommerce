import {
  updateCartCount,
  showCartPreview,
  saveCart,
  cart,
  wishlist,
  saveWishlist,
} from "./header.js";

const btnAddToCart = document.querySelector("#add-to-cart");

const wishListAddButton = document.querySelector(
  "#product-view-title-wrapper button",
);
const wishListAddButtonIcon = document.querySelector(
  "#product-view-title-wrapper button i",
);

const productName = document.querySelector("#product-view-title").textContent;
const productPrice = document.querySelector("#product-view-price").textContent;
const productImageSrc = document.querySelector("#product-view-img-src").src;

// Add to Cart
btnAddToCart.addEventListener("click", () => {
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

// Add / Remove Wishlist
const existingProduct = wishlist.find((item) => item.name === productName);

if (existingProduct) {
  if (wishListAddButtonIcon.classList.contains("fa-heart-o")) {
    wishListAddButtonIcon.classList.remove("fa-heart-o");
    wishListAddButtonIcon.classList.add("fa-heart");
    wishListAddButtonIcon.classList.add("add-red");
  }
}
wishListAddButton.addEventListener("click", () => {
  if (wishListAddButtonIcon.classList.contains("fa-heart-o")) {
    // Add to wishlist
    wishListAddButtonIcon.classList.remove("fa-heart-o");
    wishListAddButtonIcon.classList.add("fa-heart");
    wishListAddButtonIcon.classList.add("add-red");

    if (!existingProduct) {
      wishlist.push({
        name: productName,
        price: productPrice,
        image: productImageSrc,
      });
    }

    saveWishlist();

    console.log("Added:", productName);
  } else {
    // Remove from wishlist
    wishListAddButtonIcon.classList.remove("fa-heart");
    wishListAddButtonIcon.classList.remove("add-red");
    wishListAddButtonIcon.classList.add("fa-heart-o");

    const index = wishlist.findIndex((product) => product.name === productName);

    if (index !== -1) {
      wishlist.splice(index, 1);
    }

    saveWishlist();

    console.log("Removed:", productName);
  }
});
