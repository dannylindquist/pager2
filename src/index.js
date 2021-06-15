import polka from "polka";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { default as bodyparser } from "body-parser";
import { promises as fsp, createReadStream, existsSync, default as fs } from "fs";
import sirv from "sirv";
import { createServer as createViteServer } from "vite";
import { dirname, resolve, default as path } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const vite = await createViteServer({
  server: { middlewareMode: "ssr" },
});
// use vite's connect instance as middleware

let app = polka();

app.use(bodyparser.json());

app.use(vite.middlewares);

async function serveFile(req, res, file) {
  const url = req.originalUrl;
  console.log(url.trimStart("/") + ".html");

  try {
    // 1. Read index.html
    let template = fs.readFileSync(path.resolve(__dirname, file), "utf-8");

    // 2. Apply vite HTML transforms. This injects the vite HMR client, and
    //    also applies HTML transforms from Vite plugins, e.g. global preambles
    //    from @vitejs/plugin-react-refresh
    let updated = await vite.transformIndexHtml(url, template);
    console.log(template);

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
      req.user = decoded.userId;
    }
  } catch (error) {
    console.log(error);
  }
  next();
});

app.get("/", async (req, res) => {
  console.log("hello");
  if (!req.userId) {
    res.writeHead(303, {
      location: "/login",
    });
    res.end();
    return;
  }
  await serveFile(req, res, "login.html");
});

app.get("/login", async (req, res) => {
  await serveFile(req, res, "login.html");
});

app.get("/signup", async (req, res) => {
  await serveFile(req, res, "signup.html");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("started");
});
