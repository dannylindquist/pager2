import * as formee from "formee";

var form = document.querySelector("#login-form");
let feedback = document.querySelector("#feedback");

formee.bind(form, {
  rules: {
    password(val) {
      if (!val) return "Required";
      return true;
    },
    confirm(val, data) {
      return val === data.password || "Passwords must match";
    },
    email: /.+\@.+\..+/,
  },
  onSubmit: async (event) => {
    var object = formee.serialize(event.target);
    console.log(object);
    let result = await fetch(form.action, {
      method: form.method,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(object),
    });
    if (result.ok) {
      window.location = "/";
    } else {
      let message = await result.json();
      feedback.textContent = message.data.message;
      feedback.classList.add("block");
      feedback.hidden = false;
      document.getElementById("password").value = "";
      document.getElementById("confirm").value = "";
    }
  },
  onError: (event) => {
    let errors = Object.entries(event.errors).map(
      (x) => `${x[0][0].toUpperCase() + x[0].substr(1)} ${x[1]}`
    );
    console.log(errors.join(", "));
    feedback.textContent = errors.join(", ");
    feedback.classList.add("block");
    feedback.hidden = false;
  },
});
