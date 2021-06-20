import * as formee from "formee";

var form = document.querySelector("#login-form");

formee.bind(form, {
  rules: {
    password(val) {
      if (!val) return "Required";
      return true;
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
    }
  },
  onError: (event) => {
    console.log("error", event.errors);
  },
});
