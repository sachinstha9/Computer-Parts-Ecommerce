let carousel_container = document.querySelector("#carousel-container");
let carousel_items = document.querySelectorAll(".carousel-item");
let carousel_indicators = document.querySelectorAll(".carousel-indicators li");

function update_carousel(index) {
  current = index % carousel_items.length;

  carousel_container.style.transform = `translateX(-${current * 100}vw)`;

  carousel_indicators.forEach((e) => {
    e.style.background = "rgba(255, 255, 255, 0.2)";
  });

  carousel_indicators[current].style.background = "rgba(255, 255, 255, 0.8)";
}

carousel_indicators.forEach((indicator, i) => {
  indicator.addEventListener("click", () => {
    update_carousel(i);
  });
});

update_carousel(0);

let c_i = 1;

setInterval(() => {
  update_carousel(c_i);

  c_i += 1;
}, 5000);
