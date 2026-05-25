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