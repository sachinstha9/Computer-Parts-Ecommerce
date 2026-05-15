let products_section = document.querySelectorAll(".products-section");

products_section.forEach((e, i) => {
  let product_section_items_container = e.querySelector(
    ".product-section-items-container",
  );
  let product_section_items_container_style =
    product_section_items_container.getBoundingClientRect();
  let product_section_item = e.querySelectorAll(".product-section-item");
  let product_section_item_style =
    product_section_item[0].getBoundingClientRect();
  let products_section_slider = e.querySelectorAll(
    ".products-section-slider i",
  );
  let left_products_section_slider = products_section_slider[0];
  let right_products_section_slider = products_section_slider[1];

  let number_of_item_can_fit =
    product_section_items_container_style.width /
    (product_section_item_style.width + 10);
  number_of_item_can_fit = Math.floor(number_of_item_can_fit);

  let maxIndex = product_section_item.length - number_of_item_can_fit;

  let currentIndex = 0;

  left_products_section_slider.addEventListener("click", () => {
    if (currentIndex < maxIndex) currentIndex += 1;
    product_section_items_container.style.transform = `translateX(-${currentIndex * product_section_item_style.width}px)`;
  });

  right_products_section_slider.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex -= 1;
      product_section_items_container.style.transform = `translateX(-${currentIndex * product_section_item_style.width}px)`;
    }
  });
});
