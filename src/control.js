let form = document.getElementById("number-add-form");
let numbers = document.getElementById("number-list");
let es = new EventSource("/messages");
let activeMessages = [];

function insertItem(alert) {
  let container = document.createElement("div");
  container.classList.add(
    "flex",
    "bg-gray-700",
    "rounded",
    "items-center",
    "px-4",
    "py-3"
  );
  container.dataset.item = alert.alertId;
  container.innerHTML = `
      <p class="flex-1">${alert.content}</p>
      <form class="delete-item block m-0" data-item="${alert.alertId}" action='/messages' method='delete' >
        <button class="block" aria-label="delete">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </form>
    `;
  numbers.appendChild(container);
  let item = container.querySelector(".delete-item");
  if (item) {
    item.addEventListener("submit", deleteSubmit);
  }
}

function renderItems() {
  for (let item of activeMessages) {
    insertItem(item);
  }
}

async function deleteSubmit(event) {
  event.preventDefault();
  let result = await fetch(event.target.action, {
    body: JSON.stringify({
      alertId: +event.target.dataset.item,
    }),
    method: "delete",
    headers: {
      "content-type": "application/json",
    },
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  //add event

  let data = Object.fromEntries(new FormData(form).entries());

  if (data.entry.length === 0) {
    return;
  }

  let result = await fetch(form.action, {
    method: form.method,
    body: JSON.stringify(data),
    headers: {
      "content-type": "application/json",
    },
  });

  if (!result.ok) {
    let json = await result.json();
    console.log(json);
    //present error?
  }
  form.reset();
});

es.addEventListener("messages", function (e) {
  activeMessages = JSON.parse(e.data);
  renderItems();
});

es.addEventListener("added", function (e) {
  let alert = JSON.parse(e.data);
  console.log(alert);
  activeMessages.push(alert);
  insertItem(alert);
});

es.addEventListener("removed", function (e) {
  let alertId = +e.data;
  let item = numbers.querySelector(`[data-item="${alertId}"]`);
  if (item) {
    numbers.removeChild(item);
  }
});
