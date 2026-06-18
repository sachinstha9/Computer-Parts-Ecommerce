export default async function getUser() {
  const response = await fetch("/get-user", {
    method: "POST",
  });

  const data = await response.json();

  return data;
}
