var form = document.querySelector("form");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  let formData = new FormData(event.target);
  console.log(Object.fromEntries(formData.entries()));
});
