export default async function getProductDetails(productId) {
  const response = await fetch("/get-product-details", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      productId: productId,
    }),
  });

  return await response.json();
}
