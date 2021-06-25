import polka from "polka";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { default as bodyparser } from "body-parser";
import { promises as fsp, default as fs } from "fs";
import { createServer as createViteServer } from "vite";
import { dirname, default as path } from "path";
import { fileURLToPath } from "url";
import { validateDB } from "./db.js";
import {
  signupForm,
  signupUser,
  logout,
  loginUser,
  loginForm,
} from "./controllers/auth.js";
import {
  removeMessage,
  controlPage,
  displayPage,
  insertNumber,
  realTimeMessages,
  homePage,
} from "./controllers/messages.js";
import dotenv from "dotenv";
import sirv from "sirv";
import compression from "compression";

let compress = compression();
dotenv.config();
const __dirname = dirname(fileURLToPath(import.meta.url));

validateDB();

let app = polka({
  onError: function (err, req, res, next) {
    console.log(err);
    next();
  },
});

app.use(bodyparser.json());

if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: "ssr" },
  });
  app.use(vite.middlewares);
  app.use((req, res, next) => {
    res.render = async (file) => {
      await serveFile(req, res, file);
    };
    next();
  });

  async function serveFile(req, res, file) {
    const url = req.originalUrl;

    try {
      // 1. Read index.html
      let template = fs.readFileSync(
        path.resolve(__dirname, "../src", file),
        "utf-8"
      );

      let updated = await vite.transformIndexHtml(url, template);

      res.writeHead(200, {
        "Content-Type": "text/html",
      });
      res.end(updated);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      console.error(e);
      res.writeHead(500);
      res.end(e.message);
    }
  }
} else {
  let cache = new Map();
  let assets = sirv("dist/assets");
  app.use("assets", assets);

  app.use((req, res, next) => {
    res.render = async (file) => {
      let cached = cache.has(file);
      let template = cached
        ? cache.get(file)
        : fs.readFileSync(
            path.resolve(__dirname, "../dist/src", file),
            "utf-8"
          );
      if (!cached) {
        cache.set(file, template);
      }
      res.writeHead(200, {
        "Content-Type": "text/html",
      });
      res.end(template);
    };
    next();
  });
}

app.use((req, res, next) => {
  try {
    let cookies = cookie.parse(req.headers.cookie || "");
    if (cookies.token) {
      let decoded = jwt.verify(cookies.token, process.env.COOKIE_SECRET);
      req.userId = decoded.user;
    }
  } catch (error) {
    console.log(error);
  }
  next();
});

app.get("/", compress, homePage);

app.post("/login", loginUser);

app.get("/signup", compress, signupForm);

app.post("/signup", signupUser);

app.get("/login", compress, loginForm);

app.post("/logout", logout);

app.get("/control", compress, controlPage);

app.post("/messages", insertNumber);

app.get("/messages", realTimeMessages);

app.delete("/messages", removeMessage);

app.get("/display", compress, displayPage);

app.listen(process.env.PORT || 3000, () => {
  console.log("started");
});
