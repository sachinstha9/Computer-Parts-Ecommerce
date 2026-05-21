// Get all category filter buttons from the sidebar
const categoryButtons = document.querySelectorAll(".category-filter");

// Get all product cards from the product grid
const productCards = document.querySelectorAll(".product-card");


// Loop through each sidebar category button
categoryButtons.forEach(button => {

    // Run this code whenever a category button is clicked
    button.addEventListener("click", () => {

        // Remove the active class from every category button
        categoryButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        // Add the active class to the button that was clicked
        button.classList.add("active");

        // Get the selected category from the button
        const selectedCategory = button.dataset.filter;

        // Loop through every product card
        productCards.forEach(card => {

            // Get the category from the product card
            const productCategory = card.dataset.category;

            // If the selected category is "all", show every product
            if (selectedCategory === "all") {
                card.classList.remove("hidden");
            }

            // Otherwise, only show products that match the selected category
            else if (selectedCategory === productCategory) {
                card.classList.remove("hidden");
            }

            // Hide products that do not match
            else {
                card.classList.add("hidden");
            }

        });

    });

});


// ================= CART SYSTEM =================

// Get cart from local storage, or make an empty cart if there is none
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Get the cart count number from the navbar
const cartCount = document.querySelector(".cart-count");

// Get all add to cart buttons
const addButtons = document.querySelectorAll(".add-button");


// Updates the small cart number in the navbar
function updateCartCount() {

    if (cartCount) {
        cartCount.textContent = cart.length;
    }

}


// Saves the cart into the browser
function saveCart() {

    localStorage.setItem("cart", JSON.stringify(cart));

}


// Runs when an add button is clicked
addButtons.forEach(button => {

    button.addEventListener("click", () => {

        // Find the product card that the clicked button belongs to
        const card = button.closest(".product-card");

        // Get product details from the card
        const productName = card.querySelector(".product-info p").textContent;
        const productPrice = card.querySelector(".product-info strong").textContent;
        const productImage = card.querySelector("img").getAttribute("src");

        // Make a product object
        const product = {
            name: productName,
            price: productPrice,
            image: productImage,
            quantity: 1
        };

        // Add the product to the cart array
        cart.push(product);

        // Save and update the cart number
        saveCart();
        updateCartCount();

        // Give button feedback
        button.textContent = "Added ✓";

        setTimeout(() => {
            button.textContent = "Add to Cart";
        }, 800);

    });

});


// Show correct cart number when page first loads
updateCartCount();

// ================= SEARCH SYSTEM =================

// Find the search input
const searchInput = document.querySelector(".product-search");


// Runs every time the user types
searchInput.addEventListener("input", () => {

    // Get what user typed
    const searchTerm =
        searchInput.value
        .toLowerCase()
        .trim();

    // Check every product
    productCards.forEach(card => {

        // Get product title
        const productName =
            card
            .querySelector(".product-info p")
            .textContent
            .toLowerCase();

        // Show product if title includes search
        if (
            productName.includes(searchTerm)
        ) {

            card.classList.remove("hidden");

        }

        else {

            card.classList.add("hidden");

        }

    });

});