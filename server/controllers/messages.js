import { validateDB, putNumber, getNumbers, removeNumber } from "../db.js";

/**
 * @type {import("../types").RequestHandler}
 */
export async function removeMessage(req, res) {
  console.log(req.userId);
  if (req.userId === undefined) {
    res.writeHead(403, {
      "content-type": "application/json",
    });
    res.end(
      JSON.stringify({
        data: {
          message: "Login before submission",
        },
      })
    );
    return;
  }
  let result = removeNumber(req.userId, req.body.alertId);
  if (result) {
    sendRemoveNotice(req.userId, req.body.alertId);
    res.writeHead(200, {
      "content-type": "application/json",
    });
    res.end(
      JSON.stringify({
        data: {
          message: "Success",
        },
      })
    );
  } else {
    res.writeHead(500, {
      "content-type": "application/json",
    });
    res.end(
      JSON.stringify({
        data: {
          message: "Login before submission",
        },
      })
    );
  }
}

/**
 * @type {import("../types").RequestHandler}
 */
export async function controlPage(req, res) {
  if (!req.userId) {
    res.writeHead(302, {
      location: "/login",
    });
    res.end();
    return;
  }
  await res.render("control.html");
}

/**
 * @type {import("../types").RequestHandler}
 */
export async function homePage(req, res) {
  if (!req.userId) {
    res.writeHead(302, {
      location: "/login",
    });
    res.end();
    return;
  }
  await res.render("index.html");
}

/**
 * @type {import("../types").RequestHandler}
 */
export async function displayPage(req, res) {
  if (!req.userId) {
    res.writeHead(302, {
      location: "/login",
    });
    res.end();
    return;
  }
  await res.render("display.html");
}

/**
 * @type {import("../types").RequestHandler}
 */
export async function realTimeMessages(req, res) {
  const headers = {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  };
  res.writeHead(200, headers);

  let messages = getNumbers(req.userId);
  console.log(
    `connection sse: ${req.userId}, found: ${messages.length} messages`
  );
  const data = `event: messages\ndata: ${JSON.stringify(messages)}\n\n`;
  if (clients.has(req.userId)) {
    clients.get(req.userId).push(res);
  } else {
    clients.set(req.userId, [res]);
  }
  req.on("close", () => {
    console.log(`Connection closed`);
    let items = clients.get(req.userId);
    items = items.filter((client) => client !== res);
    if (items.length === 0) {
      clients.delete(req.userId);
    } else {
      clients.set(req.userId, items);
    }
  });
  res.write(data);
}

/**
 * @type {import("../types").RequestHandler}
 */
export async function insertNumber(req, res) {
  if (!req.userId) {
    res.writeHead(403, {
      "content-type": "application/json",
    });
    res.end(
      JSON.stringify({
        data: {
          message: "Login before submission",
        },
      })
    );
    return;
  }
  console.log(req.body);
  let alert = putNumber(req.userId, req.body.entry.toUpperCase());
  if (alert !== null) {
    sendAddNotice(req.userId, alert);
    res.writeHead(200, {
      "content-type": "application/json",
    });
    res.end(
      JSON.stringify({
        data: alert,
      })
    );
  } else {
    res.writeHead(200, {
      "content-type": "application/json",
    });
    res.end(
      JSON.stringify({
        data: null,
      })
    );
  }
}

let clients = new Map();
function sendRemoveNotice(userId, alertId) {
  if (clients.has(userId)) {
    clients.get(userId).forEach((res) => {
      console.log(`sending removal: ${userId}`);
      res.write(`event: removed\ndata: ${alertId}\n\n`);
    });
  }
}
function sendAddNotice(userId, alert) {
  if (clients.has(userId)) {
    clients.get(userId).forEach((res) => {
      console.log(`sending update: ${userId}`);
      res.write(`event: added\ndata: ${JSON.stringify(alert)}\n\n`);
    });
  }
}
