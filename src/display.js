import fitty from "fitty";

let displayEl = document.getElementById("shown-number");
fitty(displayEl, {
  maxSize: 1000,
});
let es = new EventSource("/messages");
let activeMessages = [];
let index = 0;

let interval;
function evaluateNumbers() {
  if (interval !== null) {
    clearInterval(interval);
    interval = null;
  }
  if (activeMessages.length === 0) {
    displayEl.innerText = "";
  } else if (activeMessages.length === 1) {
    displayEl.innerText = activeMessages[0].content;
  } else {
    interval = setInterval(() => {
      if (index < activeMessages.length) {
        displayEl.innerText = activeMessages[index++].content;
      }
      if (index >= activeMessages.length) {
        index = 0;
      }
    }, 5000);
  }
}

es.addEventListener("messages", function (e) {
  activeMessages = JSON.parse(e.data);
  evaluateNumbers();
});

es.addEventListener("added", function (e) {
  let alert = JSON.parse(e.data);
  activeMessages.push(alert);
  evaluateNumbers();
});

es.addEventListener("removed", function (e) {
  let alertId = +e.data;
  activeMessages = activeMessages.filter((x) => x.alertId !== alertId);
  evaluateNumbers();
});
