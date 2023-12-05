// index.js
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const path = require("path");

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const knex = require("knex")({
  client: "pg",
  connection: {
    host: "localhost",
    user: "postgres",
    password: "admin",
    database: "intex",
    port: 5432,
  },
});

const PORT = process.env.PORT || 3000;
// Route to render the index.ejs file
app.get("/", (req, res) => {
  res.render("index");
});

app.post("/addname", async (req, res) => {
  const { name } = req.body;
  try {
    const newEntry = await knex("users").insert({ name: name }).returning("*");

    //renders sucess page
    res.render("user_added", { name: newEntry[0].name });

    //error message
  } catch (err) {
    console.error(err.message);
    res.send("Error in adding user");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
