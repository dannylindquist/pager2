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
    )`
      )
      .run();

    sql
      .prepare(
        `
      create table alert(
        alertId integer primary key,
        userId integer,
        content text,
        timestamp integer,
        foreign key(userId) references user(userId)
      )
    `
      )
      .run();
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
      `
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
      `
      )
      .get(email);
    return result;
  } catch (err) {
    console.log(err);
  }

  return null;
}

export function getNumbers(userId) {
  try {
    let result = sql
      .prepare(
        `
      select * from alert where  userId = ?
    `
      )
      .all(userId);
    return result;
  } catch (err) {
    console.log(err);
  }
  return null;
}

export function removeNumber(userId, alertId) {
  try {
    let result = sql
      .prepare(
        `
      delete from alert where alertId = ? and userId = ?
    `
      )
      .run(alertId, userId);
    return result.changes > 0;
  } catch (err) {
    console.log(err);
  }
  return false;
}

export function putNumber(userId, number) {
  try {
    let result = sql
      .prepare(
        `
      insert into alert(userId, content, timestamp) values (?, ?, ?)
    `
      )
      .run(userId, number, Date.now());
    if (result.lastInsertRowid > 0) {
      let value = sql
        .prepare(`select * from alert where userId = ? and alertId = ?`)
        .get(userId, result.lastInsertRowid);
      return value;
    }
  } catch (err) {
    console.log(err);
  }
  return null;
}
