const express = require("express");

let app = express();

let path = require("path");

const port = process.env.PORT || 3000;

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

const knex = require("knex")({
  client: "pg",
  connection: {
    host: process.env.RDS_HOSTNAME || "localhost",
    user: process.env.RDS_USERNAME || "postgres",
    password: process.env.RDS_PASSWORD || "admin",
    database: process.env.RDS_DB_NAME || "bucket_list",
    port: process.env.RDS_PORT || 5432,
    ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false,
  },
});

//route, needs two things, request object and response

app.get("/", (req, res) => {
  knex
    .select()
    .from("country")
    .then((country) => {
      // respond with html and data
      res.render("displayCountry", { myCountry: country });
    });
});

app.listen(port, () => console.log("Listening"));
