const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const dateMatch = require("date-fns/isMatch");
const format = require("date-fns/format");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started at http://localhost:3000");
    });
  } catch (e) {
    console.log(`Db Error:${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const priorityAndStatus = (query) => {
  return query.priority !== undefined && query.status !== undefined;
};
const priorityAndCategory = (query) => {
  return query.priority !== undefined && query.category !== undefined;
};
const hasPriority = (query) => {
  return query.priority !== undefined;
};
const hasStatus = (query) => {
  return query.status !== undefined;
};
const categoryAndStatus = (query) => {
  return query.category !== undefined && query.status !== undefined;
};
const hasCategory = (query) => {
  return query.category !== undefined;
};
const hasSearch = (query) => {
  return query.search_q !== undefined;
};

const snakeToCamel = (dbRes) => {
  return {
    id: dbRes.id,
    todo: dbRes.todo,
    priority: dbRes.priority,
    status: dbRes.status,
    category: dbRes.category,
    dueDate: dbRes.due_date,
  };
};

//API 1
app.get("/todos/", async (request, response) => {
  let dbRes = null;
  let getTodos = "";
  const { search_q = "", priority, status, category } = request.query;
  switch (true) {
    case priorityAndStatus(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodos = `
                    SELECT * FROM todo WHERE status="${status}" AND priority='${priority}'`;
          dbRes = await db.all(getTodos);
          response.send(dbRes.map((each) => snakeToCamel(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case priorityAndCategory(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodos = `
                    SELECT * FROM todo WHERE category="${category}" AND priority='${priority}'`;
          dbRes = await db.all(getTodos);
          response.send(dbRes.map((each) => snakeToCamel(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case categoryAndStatus(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        if (
          category === "WORK" ||
          category === "HOME" ||
          category === "LEARNING"
        ) {
          getTodos = `
                    SELECT * FROM todo WHERE category="${category}" AND status='${status}'`;
          dbRes = await db.all(getTodos);
          response.send(dbRes.map((each) => snakeToCamel(each)));
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasPriority(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodos = `
            SELECT * FROM todo WHERE priority='${priority}'`;
        dbRes = await db.all(getTodos);
        response.send(dbRes.map((each) => snakeToCamel(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
    case hasStatus(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodos = `
            SELECT * FROM todo WHERE status='${status}'`;
        dbRes = await db.all(getTodos);
        response.send(dbRes.map((each) => snakeToCamel(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasCategory(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodos = `
            SELECT * FROM todo WHERE category='${category}'`;
        dbRes = await db.all(getTodos);
        response.send(dbRes.map((each) => snakeToCamel(each)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasSearch(request.query):
      getTodos = `
          SELECT * FROM todo WHERE todo LIKE '%${search_q}%'`;
      dbRes = await db.all(getTodos);
      response.send(dbRes.map((each) => snakeToCamel(each)));
      break;
    default:
      getTodos = `
          SELECT * FROM todo`;
      dbRes = await db.all(getTodos);
      response.send(dbRes.map((each) => snakeToCamel(each)));
  }
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodo = `
    SELECT * FROM todo WHERE id=${todoId}`;
  const dbRes = await db.get(getTodo);
  response.send(snakeToCamel(dbRes));
});

//API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  console.log(dateMatch(date, "yyyy-MM-dd"));
  if (dateMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const getDate = `
    SELECT * FROM todo WHERE due_date="${newDate}"`;
    const dbRes = await db.all(getDate);
    response.send(dbRes.map((each) => snakeToCamel(each)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (dateMatch(dueDate, "yyyy-MM-dd")) {
          const newDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postTodo = `
            INSERT INTO todo(id, todo, priority, status, category, due_date)
            VALUES(
                ${id},
                "${todo}",
                '${priority}',
                '${status}',
                '${category}',
                '${newDate}'
            )`;
          await db.run(postTodo);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const reqBody = request.body;
  let updateColumn = "";
  const previous = `SELECT * FROM todo WHERE id=${todoId}`;
  const previousRes = await db.get(previous);

  const {
    todo = previousRes.todo,
    priority = previousRes.priority,
    status = previousRes.status,
    category = previousRes.category,
    dueDate = previous.dueDate,
  } = request.body;
  let updateTodo;
  switch (true) {
    case reqBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodo = `
            UPDATE todo set
            todo='${todo}',
            priority='${priority}',
            status='${status}',
            category='${category}',
            due_date='${dueDate}' WHERE id=${todoId}`;
        await db.run(updateTodo);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case reqBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodo = `
            UPDATE todo set
            todo='${todo}',
            priority='${priority}',
            status='${status}',
            category='${category}',
            due_date='${dueDate}' WHERE id=${todoId}`;
        await db.run(updateTodo);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case reqBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodo = `
            UPDATE todo set
            todo='${todo}',
            priority='${priority}',
            status='${status}',
            category='${category}',
            due_date='${dueDate}' WHERE id=${todoId}`;
        await db.run(updateTodo);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case reqBody.dueDate !== undefined:
      if (dateMatch(dueDate, "yyyy-MM-dd")) {
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodo = `
            UPDATE todo set
            todo='${todo}',
            priority='${priority}',
            status='${status}',
            category='${category}',
            due_date='${newDate}' WHERE id=${todoId}`;
        await db.run(updateTodo);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
    case reqBody.todo !== undefined:
      updateTodo = `UPDATE todo set
            todo='${todo}',
            priority='${priority}',
            status='${status}',
            category='${category}',
            due_date='${dueDate}' WHERE id=${todoId}`;
      await db.run(updateTodo);
      response.send("Todo Updated");
      break;
  }
});

//API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodo = `
    DELETE FROM todo WHERE id=${todoId}`;
  await db.run(deleteTodo);
  response.send("Todo Deleted");
});

module.exports = app;
