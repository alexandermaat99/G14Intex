// index.js
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

const app = express();
const path = require("path");
app.use(express.static("public"));
app.use('/public', express.static(__dirname + '/public'));


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
    password: "Ramsbasketball22",
    database: "intex",
    port: 5432,
  },
});

const PORT = process.env.PORT || 3000;

// Route to render the index.ejs file
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  const error = "";
  res.render("login", { error }); // Render the login form
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log("Received email:", email);
    console.log("Received password:", password);

    const user = await knex("users").where({ email }).first();

    console.log("User from the database:", user);

    if (!user) {
      // User not found
      console.log("User not found");
      const error = "Invalid credentials";
      return res.render("login", { error });
    }

    console.log("Hashed Password from DB:", user.password);

    // const passwordMatch = await bcrypt.compare(password, user.password);
    const passwordMatch = user.password === password;
    if (passwordMatch) {
      // Authentication successful
      console.log("Authentication successful");
      // Create a session or JWT token to manage user sessions
      // Redirect to a protected user page or perform other actions as needed
      res.redirect("/dashboard");
    } else {
      // Incorrect password
      console.log("Incorrect password");
      const error = "Invalid credentials";
      res.render("login", { error });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

app.get("/survey",(req, res) => {
  res.render("survey");
});

app.get("/dashboard",(req, res) => {
  res.render("dashboard");
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

// UserPage Route
app.get("/userPage", async (req, res) => {
  try {
    const users = await knex.select().from("users");
    res.render("userPage", { users: users });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading users");
  }
});

// Add User Route
app.post("/addUser", async (req, res) => {
  const { name } = req.body; // Update with actual form fields
  try {
    const newEntry = await knex("users").insert({ name }).returning("*");
    res.render("user_added", { name: newEntry[0].name });
  } catch (err) {
    console.error(err.message);
    res.send("Error in adding user");
  }
});

// Edit User Routes
app.get("/editUser/:id", (req, res) => {
  knex
    .select("id", "fName", "lName", "email", "phone", "password")
    .from("users")
    .where("id", req.params.id)
    .then((data) => {
      res.render("editUser", { user: data[0] });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: "Failed to fetch user" });
    });
  // Logic for edit user form
});

app.post("/editUser/:id", (req, res) => {
  // Logic for updating user
});

// Delete User Route
app.get("/deleteUser/:id", (req, res) => {
  // Logic for deleting user
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
