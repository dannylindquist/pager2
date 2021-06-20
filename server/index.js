import polka from "polka";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { default as bodyparser } from "body-parser";
import { promises as fsp, default as fs } from "fs";
import { createServer as createViteServer } from "vite";
import { dirname, default as path } from "path";
import { fileURLToPath } from "url";
import {
  validateDB,
  createUser,
  getUser,
  putNumber,
  removeNumber,
  getNumbers,
} from "./db.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();
const __dirname = dirname(fileURLToPath(import.meta.url));

validateDB();

const vite = await createViteServer({
  server: { middlewareMode: "ssr" },
});
// use vite's connect instance as middleware

let clients = new Map();
function sendRemoveNotice(userId, alertId) {
  if (clients.has(userId)) {
    clients.get(userId).forEach((res) => {
      res.write(`event: removed\ndata: ${alertId}\n\n`);
    });
  }
}
function sendAddNotice(userId, alert) {
  if (clients.has(userId)) {
    clients.get(userId).forEach((res) => {
      res.write(`event: added\ndata: ${JSON.stringify(alert)}\n\n`);
    });
  }
}

let app = polka();

app.use(bodyparser.json());

app.use(vite.middlewares);

async function serveFile(req, res, file) {
  const url = req.originalUrl;

  try {
    // 1. Read index.html
    let template = fs.readFileSync(
      path.resolve(__dirname, "../src", file),
      "utf-8"
    );

    // 2. Apply vite HTML transforms. This injects the vite HMR client, and
    //    also applies HTML transforms from Vite plugins, e.g. global preambles
    //    from @vitejs/plugin-react-refresh
    let updated = await vite.transformIndexHtml(url, template);

    // 6. Send the rendered HTML back.
    res.writeHead(200, {
      "Content-Type": "text/html",
    });
    res.end(updated);
  } catch (e) {
    // If an error is caught, let vite fix the stracktrace so it maps back to
    // your actual source code.
    vite.ssrFixStacktrace(e);
    console.error(e);
    res.writeHead(500);
    res.end(e.message);
  }
}

app.use((req, res, next) => {
  try {
    let cookies = cookie.parse(req.headers.cookie || "");
    if (cookies.token) {
      let decoded = jwt.verify(cookies.token, process.env.COOKIE_SECRET);
      req.userId = decoded.user;
      console.log(req.userId);
    }
  } catch (error) {
    console.log(error);
  }
  next();
});

app.get("/", async (req, res) => {
  if (!req.userId) {
    res.writeHead(302, {
      location: "/login",
    });
    res.end();
    return;
  }
  await serveFile(req, res, "index.html");
});

app.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;
    if (email && password) {
      let user = getUser(email);
      let match = await bcrypt.compare(password, user.password);
      if (match) {
        let token = jwt.sign(
          {
            user: user.userId,
          },
          process.env.COOKIE_SECRET,
          {
            expiresIn: "30 days",
          }
        );
        let tokenCookie = cookie.serialize("token", token, {
          httpOnly: true,
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
        });
        res.setHeader("set-cookie", tokenCookie);
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ data: { message: "success" } }));
        return;
      }
    }
    res.setHeader("content-type", "application/json");
    res.statusCode = 403;
    res.end(JSON.stringify({ data: { message: "Could not login" } }));
  } catch (error) {
    console.log(error);
    res.end();
  }
});

app.get("/signup", async (req, res) => {
  if (req.userId) {
    res.writeHead(302, {
      location: "/",
    });
    res.end();
    return;
  }
  await serveFile(req, res, "signup.html");
});

app.post("/signup", async (req, res) => {
  let { email, password, confirm } = req.body;
  if (email && password && password === confirm) {
    let pass = await bcrypt.hash(password, 10);
    let userId = createUser(email, pass);
    let token = jwt.sign(
      {
        user: userId,
      },
      process.env.COOKIE_SECRET,
      {
        expiresIn: "30 days",
      }
    );
    let cookie = cookie.serialize("token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
    });
    res.setHeader("set-cookie", cookie);
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ data: { message: "success" } }));
    return;
  }
  res.setHeader("content-type", "application/json");
  res.statusCode = 500;
  res.end(JSON.stringify({ data: { message: "Could not create account" } }));
});

app.get("/login", async (req, res) => {
  if (req.userId > 0) {
    res.writeHead(302, {
      location: "/",
    });
    res.end();
    return;
  }
  await serveFile(req, res, "login.html");
});

app.get("/control", async (req, res) => {
  if (!req.userId) {
    res.writeHead(302, {
      location: "/login",
    });
    res.end();
    return;
  }
  await serveFile(req, res, "control.html");
});

app.post("/control", async (req, res) => {
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
  let alert = putNumber(req.userId, req.body.entry);
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
});

app.get("/messages", (req, res) => {
  const headers = {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  };
  res.writeHead(200, headers);

  let messages = getNumbers(req.userId);
  const data = `event: messages\ndata: ${JSON.stringify(messages)}\n\n`;
  if (clients.has(req.userId)) {
    clients.get(req.userId).push(res);
  } else {
    clients.set(req.userId, [res]);
  }
  console.log(clients.size);
  req.on("close", () => {
    console.log(`Connection closed`);
    let items = clients.get(req.userId);
    items = items.filter((client) => client !== res);
    if (items.length === 0) {
      clients.delete(req.userId);
    } else {
      clients.set(req.userId, items);
    }
    console.log(clients.size);
  });
  res.write(data);
});

app.delete("/messages", (req, res) => {
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
});

app.get("/display", async (req, res) => {
  if (!req.userId) {
    res.writeHead(302, {
      location: "/login",
    });
    res.end();
    return;
  }
  await serveFile(req, res, "display.html");
});

app.post("/logout", (req, res) => {
  res.writeHead(302, {
    location: "/",
    "set-cookie": cookie.serialize("token", "", {
      expires: new Date(0),
      path: "/",
      httpOnly: true,
    }),
  });
  res.end();
});

app.listen(process.env.PORT || 3000, () => {
  console.log("started");
});
