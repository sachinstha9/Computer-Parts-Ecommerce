export default async function getItemDetails() {
  const response = await fetch("/get-item-details", {
    method: "POST",
  });

  const data = await response.json();

  return data;
}
