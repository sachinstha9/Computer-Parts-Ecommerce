export default function getUser() {
  let data = {};

  fetch("/get-user")
    .then((response) => response.json())
    .then((e) => (data = e));

  return data;
}
