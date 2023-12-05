// index.js
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const path = require("path");
app.use(express.static("public"));

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
    password: "Ramsbasketball22" || "admin",
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
  res.render("login"); // Render the login form
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await knex("users").where({ username }).first();

    if (!user) {
      // User not found
      return res.status(401).send("Invalid credentials");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      // Authentication successful
      // Create a session or JWT token to manage user sessions
      // Redirect to a protected user page or perform other actions as needed
      res.redirect("/userPage");
    } else {
      // Incorrect password
      res.status(401).send("Invalid credentials");
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
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
app.get("/edit/:id", (req, res) => {
  // Logic for edit user form
});

app.post("/edit/:id", (req, res) => {
  // Logic for updating user
});

// Delete User Route
app.get("/delete/:id", (req, res) => {
  // Logic for deleting user
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
