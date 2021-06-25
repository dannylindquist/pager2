import jwt from "jsonwebtoken";
import cookie from "cookie";
import {
  createUser,
  getUser,
  putNumber,
  removeNumber,
  getNumbers,
} from "../db.js";
import bcrypt from "bcryptjs";

/**
 * @type {import("../types").RequestHandler}
 */
export async function signupForm(req, res) {
  if (req.userId) {
    res.writeHead(302, {
      location: "/",
    });
    res.end();
    return;
  }
  await res.render("signup.html");
}

/**
 * @type {import("../types").RequestHandler}
 */
export async function signupUser(req, res) {
  let { email, password, confirm } = req.body;
  if (email && password && password === confirm) {
    let pass = await bcrypt.hash(password, 10);
    let userId = createUser(email.toLowerCase(), pass);
    if (userId > 0) {
      let token = jwt.sign(
        {
          user: userId,
        },
        process.env.COOKIE_SECRET,
        {
          expiresIn: "30 days",
        }
      );
      let token_cookie = cookie.serialize("token", token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
      });
      res.setHeader("set-cookie", token_cookie);
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ data: { message: "success" } }));
      return;
    } else {
      res.setHeader("content-type", "application/json");
      res.statusCode = 400;
      res.end(JSON.stringify({ data: { message: "Email already is use" } }));
      return;
    }
  }
  res.setHeader("content-type", "application/json");
  res.statusCode = 500;
  res.end(JSON.stringify({ data: { message: "Could not create account" } }));
}

/**
 * @type {import("../types").RequestHandler}
 */
export async function loginForm(req, res) {
  if (req.userId > 0) {
    res.writeHead(302, {
      location: "/",
    });
    res.end();
    return;
  }
  await res.render("login.html");
}

/**
 * @type {import("../types").RequestHandler}
 */
export async function logout(req, res) {
  res.writeHead(302, {
    location: "/",
    "set-cookie": cookie.serialize("token", "", {
      expires: new Date(0),
      path: "/",
      httpOnly: true,
    }),
  });
  res.end();
}

/**
 * @type {import("../types").RequestHandler}
 */
export async function loginUser(req, res) {
  try {
    let { email, password } = req.body;
    if (email && password) {
      let user = getUser(email.toLowerCase());
      if (user) {
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
    }
    res.setHeader("content-type", "application/json");
    res.statusCode = 403;
    res.end(JSON.stringify({ data: { message: "Invalid email or password" } }));
  } catch (error) {
    console.log(error);
    res.end();
  }
}
