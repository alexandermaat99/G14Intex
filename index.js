// index.js

const express = require("express");
const app = express();
const path = require("path");

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
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

// Route to render the index.ejs file
app.get("/", (req, res) => {
  const data = {
    title: "Simple EJS Example",
    message: "Welcome to EJS!",
    items: ["Item 1", "Item 2", "Item 3"], // Example array of items
  };
  res.sendFile(path.join(__dirname + "/views/index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
