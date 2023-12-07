// index.js
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session"); // Added for session handling
const bcrypt = require("bcrypt"); // Added for password hashing

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

// Session configuration
app.use(
  session({
    secret: "thisisthesecretkey", // Replace with your own secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Use 'true' in a production environment with HTTPS
  })
);

// conect to database
const knex = require("knex")({
  client: "pg",
  connection: {
    host: process.env.RDS_HOSTNAME || "localhost",
    user: process.env.RDS_USERNAME || "postgres",
    password: process.env.RDS_PASSWORD || "admin",
    database: process.env.RDS_DB_NAME || "testing",
    port: process.env.RDS_PORT || 5432,
    ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false,
  },
});

// Authentication middleware
function checkAuthentication(req, res, next) {
  console.log("Session data:", req.session); // Debugging line
  if (req.session.userId) {
    next();
  } else {
    res.redirect("/login");
  }
}

// Admin check middleware
function checkAdmin(req, res, next) {
  console.log("Admin check for user ID:", req.session.userId); // Debugging line
  if (req.session.isAdmin) {
    next();
  } else {
    res.status(403).send("Access denied");
  }
}

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
// POST login route modified for session handling
app.post("/login", async (req, res) => {
  let { email, password } = req.body;

  email = email.toUpperCase(); // Convert email to uppercase

  try {
    const user = await knex("users").where({ email }).first();

    if (!user) {
      // User not found
      const error = "Invalid credentials";
      return res.render("login", { error });
    }

    const passwordMatch = user.password === password;

    if (passwordMatch) {
      // Authentication successful
      req.session.userId = user.id;
      req.session.isAdmin = user.admin;

      if (user.admin) {
        // Redirect to admin_home.ejs for admin users
        return res.redirect("/admin_home");
      } else {
        // Redirect to user_home.ejs for non-admin users
        return res.redirect("/user_home");
      }
    } else {
      // Incorrect password
      const error = "Invalid credentials";
      return res.render("login", { error });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

// GET route for user home page
app.get("/admin_home", (req, res) => {
  res.render("admin_home"); // Assuming you have a user_home.ejs file
});

// GET route for user home page
app.get("/user_home", (req, res) => {
  res.render("user_home"); // Assuming you have a user_home.ejs file
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
app.get("/userPage", checkAuthentication, checkAdmin, async (req, res) => {
  try {
    let query = knex.select().from("users");

    if (req.query.sort) {
      query = query.orderBy(req.query.sort, req.query.order || "asc");
    }

    const users = await query;
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
app.get("/editUser/:id", checkAuthentication, checkAdmin, async (req, res) => {
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

// POST editUser route - Admin Only
app.post("/editUser/:id", checkAuthentication, checkAdmin, async (req, res) => {
  let { fName, lName, email, phone, password, admin } = req.body;
  fName = fName.toUpperCase();
  lName = lName.toUpperCase();
  email = email.toUpperCase();
  const userId = req.params.id;

  try {
    // Check if email already exists for another user
    const existingUser = await knex("users")
      .where("email", email)
      .andWhere("id", "!=", userId)
      .first();

    if (existingUser) {
      // Email already in use by another account
      // Redirect to the emailError page
      return res.render("emailError");
    }

    // Proceed with updating the user's information
    await knex("users")
      .where("id", userId)
      .update({ fName, lName, email, phone, password, admin });

    const updatedUser = await knex("users").where("id", userId).first();
    res.render("editUser", {
      user: updatedUser,
      success: "User updated successfully.",
    });
  } catch (error) {
    console.error(error);
    const user = await knex("users").where("id", userId).first();
    res.render("editUser", {
      user,
      error: "Error updating user. Please try again.",
    });
  }
});

// GET add user route
app.get("/addUser", checkAuthentication, checkAdmin, (req, res) => {
  res.render("addUser");
});

// POST add user route
app.post("/addUser", checkAuthentication, checkAdmin, async (req, res) => {
  let { fName, lName, email, phone, password, admin } = req.body;
  fName = fName.toUpperCase();
  lName = lName.toUpperCase();
  email = email.toUpperCase();

  try {
    // Check if email already exists
    const existingUser = await knex("users").where("email", email).first();
    if (existingUser) {
      // Email already in use by another account
      // Redirect to the emailError page
      return res.render("emailError");
    }

    // Add the user to the database
    const newUser = await knex("users")
      .insert({ fName, lName, email, phone, password, admin }) // Hash password before storing
      .returning("*");

    res.redirect("/userPage");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error adding user");
  }
});

// POST delete User Route
app.post(
  "/deleteUser/:id",
  checkAuthentication,
  checkAdmin,
  async (req, res) => {
    try {
      await knex("users").where("id", req.params.id).del();
      res.redirect("/userPage");
    } catch (err) {
      console.error(err);
      res.status(500).send("Error deleting user");
    }
  }
);

//survey route
app.post("/submit-survey", async (req, res) => {
  try {
    // Begin transaction
    await knex.transaction(async (trx) => {
      // Insert into 'responses' table
      const [responseIdObject] = await trx("responsesinfo")
        .insert({
          age: req.body.age,
          gender: req.body.gender,
          relationship: req.body.relationship,
          occupation: req.body.occupation,
          socialmediause: req.body.socialmediause === "yes",
          avgtime: req.body.avgtime,
          withoutpurpose: req.body.withoutpurpose,
          oftendistracted: req.body.oftendistracted,
          restless: req.body.restless,
          easilydistracted: req.body.easilydistracted,
          botheredworries: req.body.botheredworries,
          concentration: req.body.concentration,
          comparison: req.body.comparison,
          comparisonfeeling: req.body.comparisonfeeling,
          validation: req.body.validation,
          depression: req.body.depression,
          interest: req.body.interest,
          sleep: req.body.sleep,
          location: req.body.location,
          timestamp: new Date(),
        })
        .returning("responseid");

      const responseId = responseIdObject.responseid; // Extract the integer value from the object

      // Insert into 'socialmediaids' table for each selected social media
      const selectedSocialMedias = req.body.socialmediatypeid || [];
      for (const socialMediaTypeId of selectedSocialMedias) {
        await trx("socialmedia_link").insert({
          responseid: responseId, // This should now be an integer
          socialmediaid: socialMediaTypeId,
        });
      }

      // Insert into 'orgids' table for each selected organization
      const selectedOrganizations = req.body.organizations || [];
      for (const organizationId of selectedOrganizations) {
        await trx("org_link").insert({
          responseid: responseId,
          organizationid: organizationId,
        });
      }
    });

    res.send("Survey submitted successfully");
  } catch (error) {
    console.error("Error processing survey:", error);
    res.status(500).send("Error submitting survey");
  }
});

// Admin route to fetch and display data
app.get("/admin/data", checkAuthentication, checkAdmin, async (req, res) => {
  try {
    let query = knex
      .select("responseid", "timestamp", "location")
      .from("responsesinfo");

    if (req.query.location) {
      query = query.where("location", req.query.location);
    }

    if (req.query.responseid) {
      query = query.where("responseid", req.query.responseid);
    }

    const data = await query;
    res.render("admin_data", { data });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving data");
  }
});

// POST login route modified for session handling
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  // ... existing login logic ...
  if (passwordMatch) {
    // Set session details on successful login
    req.session.userId = user.id;
    req.session.isAdmin = user.admin; // Assuming 'admin' is a boolean in your user table
    res.redirect("/dashboard");
  } else {
    // ... handle failed login ...
  }
});

// Route to display the details of a specific response
app.get("/response-detail/:id", async (req, res) => {
  try {
    const responseId = req.params.id;
    const response = await knex("responsesinfo")
      .where("responseid", responseId)
      .first();

    if (!response) {
      return res.status(404).send("Response not found");
    }

    // Query for social media information
    const socialMedia = await knex("socialmedia_link")
      .join(
        "socialmediainfo",
        "socialmediainfo.socialmediaid",
        "socialmedia_link.socialmediaid"
      )
      .where("socialmedia_link.responseid", responseId)
      .select("socialmediainfo.platformname");

    // Query for organization information
    const organizations = await knex("org_link")
      .join(
        "organizationinfo",
        "organizationinfo.organizationid",
        "org_link.organizationid"
      )
      .where("org_link.responseid", responseId)
      .select("organizationinfo.orgaffil");
    // Render the page with response, social media, and organization data
    res.render("response_detail", {
      response,
      socialMedia,
      organizations,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving response data");
  }
});

// GET route for editing account information - Admin Only
app.get("/edit-account", checkAuthentication, checkAdmin, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await knex("users").where("id", userId).first();

    if (user) {
      res.render("edit_acct", { user });
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// POST route for updating user account information
app.post("/edit-account", checkAuthentication, checkAdmin, async (req, res) => {
  const userId = req.session.userId;
  let { fName, lName, email, phone, password } = req.body;

  try {
    // Convert fName, lName, and email to uppercase
    fName = fName.toUpperCase();
    lName = lName.toUpperCase();
    email = email.toUpperCase();

    // Check if email already exists for another user
    const existingUser = await knex("users")
      .where("email", email)
      .andWhere("id", "!=", userId)
      .first();

    if (existingUser) {
      return res.render("emailError");
    }

    // Proceed with updating the user's information
    await knex("users")
      .where("id", userId)
      .update({ fName, lName, email, phone, password });

    // Render the same page with a success message
    res.render("edit_acct", {
      user: req.body,
      success: "Account updated successfully.",
    });
  } catch (error) {
    console.error(error);

    // Render the page with an error message instead of sending a separate response
    res.render("edit_acct", {
      user: req.body,
      error: "Error updating account. Please try again.",
    });
  }
});
// GET route for editing account information
app.get("/edit-account2", checkAuthentication, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await knex("users").where("id", userId).first();

    if (user) {
      res.render("edit_acct_user", { user });
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// POST route for updating user account information
// POST route for updating user account information
app.post("/edit-account2", checkAuthentication, async (req, res) => {
  const userId = req.session.userId;
  let { fName, lName, email, phone, password } = req.body;

  try {
    // Convert fName, lName, and email to uppercase
    fName = fName.toUpperCase();
    lName = lName.toUpperCase();
    email = email.toUpperCase();

    // Check if email already exists for another user
    const existingUser = await knex("users")
      .where("email", email)
      .andWhere("id", "!=", userId)
      .first();

    if (existingUser) {
      return res.render("emailError");
    }

    // Proceed with updating the user's information
    await knex("users")
      .where("id", userId)
      .update({ fName, lName, email, phone, password });

    // Fetch updated user info to check if they are admin or not
    const updatedUser = await knex("users").where("id", userId).first();

    // Render the same page with a success message
    if (updatedUser.admin) {
      res.render("edit_acct_user", {
        user: req.body,
        success: "Account updated successfully.",
        redirectPath: "/admin_home", // Redirect to admin home if user is an admin
      });
    } else {
      res.render("edit_acct_user", {
        user: req.body,
        success: "Account updated successfully.",
        redirectPath: "/user_home", // Redirect to user home if user is not an admin
      });
    }
  } catch (error) {
    console.error(error);

    // Render the page with an error message instead of sending a separate response
    res.render("edit_acct_user", {
      user: req.body,
      error: "Error updating account. Please try again.",
      redirectPath: updatedUser.admin ? "/admin_home" : "/user_home",
    });
  }
});

// POST for logout verify
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error occurred while logging out");
    } else {
      res.redirect("/");
    }
  });
});

// port response
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
