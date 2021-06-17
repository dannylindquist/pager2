import Database from "better-sqlite3";

let sql = new Database("./data.db");

export function validateDB() {
  let tables = sql.prepare(`select name from sqlite_master`).all();
  console.log(tables);
  if (!tables.find((x) => x.name === "user")) {
    sql
      .prepare(
        `
    create table user(
      userId integer primary key autoincrement, 
      email text unique,
      password text,
      createdOn integer
    )`,
      )
      .run();

    sql.prepare(`
      create table alert(
        alertId integer primary key,
        userId integer,
        content text,
        timestamp integer,
        foreign key(userId) references user(userId)
      )
    `);
  }
}

export function createUser(email, password) {
  try {
    let result = sql
      .prepare(
        `
        insert into user(email, password, createdOn) values(
          ?,?,?
        )
      `,
      )
      .run(email, password, Date.now());
    return result.lastInsertRowid;
  } catch (err) {
    console.log(err);
  }

  return -1;
}

export function getUser(email) {
  try {
    let result = sql
      .prepare(
        `
        select * from user where email = ?
      `,
      )
      .get(email);
    return result;
  } catch (err) {
    console.log(err);
  }

  return null;
}
