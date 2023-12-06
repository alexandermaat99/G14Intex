// index.js
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const path = require("path");

// Serve static files from the public folder
app.use(express.static("public"));
app.use("/public", express.static(__dirname + "/public"));

// Set EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// conect to database
const knex = require("knex")({
  client: "pg",
  connection: {
    host: "localhost",
    user: "postgres",
    password: "admin",
    database: "testing",
    port: 5432,
  },
});

// dynamic port binding
const PORT = process.env.PORT || 3000;

// Route to render the index.ejs file
app.get("/", (req, res) => {
  res.render("index");
});

// GET to render the login.ejs file
app.get("/login", (req, res) => {
  const error = "";
  res.render("login", { error }); // Render the login form
});

// POST login route
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

// GET route to survery page
app.get("/survey", (req, res) => {
  res.render("survey");
});

// GET route to dashboard page
app.get("/dashboard", (req, res) => {
  res.render("dashboard");
});

// GET userPage Route
app.get("/userPage", async (req, res) => {
  try {
    const users = await knex.select().from("users");
    res.render("userPage", { users: users });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading users");
  }
});

// POST add user
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

// GET edit user route
app.get("/editUser/:id", async (req, res) => {
  try {
    const user = await knex("users").where("id", req.params.id).first();
    if (user) {
      res.render("editUser", { user });
    } else {
      res.status(404).send("User not found");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading user");
  }
});

// POST edituser route
app.post("/editUser/:id", async (req, res) => {
  const { fName, lName, email, phone, password } = req.body;
  try {
    await knex("users")
      .where("id", req.params.id)
      .update({ fName, lName, email, phone, password });
    res.redirect("/userPage");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating user");
  }
});

// GET add user route
app.get("/addUser", (req, res) => {
  res.render("addUser");
});

// POST add user route
app.post("/addUser", async (req, res) => {
  const { fName, lName, email, phone, password } = req.body;
  try {
    // Add the user to the database
    // Note: You should hash the password before storing it
    const newUser = await knex("users")
      .insert({
        fName,
        lName,
        email,
        phone,
        password, // Ideally, hash this password before storing
      })
      .returning("*");

    // Redirect to the user page or display a success message
    res.redirect("/userPage");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error adding user");
  }
});

// POST delete User Route
app.post("/deleteUser/:id", async (req, res) => {
  try {
    await knex("users").where("id", req.params.id).del();
    res.redirect("/userPage");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting user");
  }
});

// port response
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
