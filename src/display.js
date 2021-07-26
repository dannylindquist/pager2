// @ts-check
import fitty from "fitty";

let displayEl = document.getElementById("shown-number");
fitty(displayEl, {
  maxSize: 1000,
});
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

function receiveAllMessages(e) {
  activeMessages = JSON.parse(e.data);
  evaluateNumbers();
}

function receiveNewMessage(e) {
  let alert = JSON.parse(e.data);
  activeMessages.push(alert);
  evaluateNumbers();
}

function receiveRemoveMessage(e) {
  let alertId = +e.data;
  activeMessages = activeMessages.filter((x) => x.alertId !== alertId);
  evaluateNumbers();
}

/**
 * @type {EventSource}
 */
let es;
function startListening() {
  if (es) {
    es.removeEventListener("message", receiveAllMessages);
    es.removeEventListener("added", receiveNewMessage);
    es.removeEventListener("removed", receiveRemoveMessage);
    es.close();
    es = null;
  }
  es = new EventSource("/messages");
  es.addEventListener("messages", receiveAllMessages);
  es.addEventListener("added", receiveNewMessage);
  es.addEventListener("removed", receiveRemoveMessage);
}

document.addEventListener("visibilitychange", (event) => {
  if (document.visibilityState == "visible") {
    startListening();
  }
});

startListening();
