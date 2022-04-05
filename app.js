const env = process.env.NODE_ENV || "development"; // for app.js to connect to postgresQL
const express = require("express");
const app = express();
const ejs = require("ejs");
const PORT = 5000;
const path = require("path");
const config = require("./config.js")[env];
const Pool = require("pg").Pool;
const bodyParser = require("body-parser");
const { json, jsonp } = require("express/lib/response");
const req = require("express/lib/request");
const {createHash, scryptSync, randomBytes} = require('crypto');

// create hashing function
function hash(input) {
    return createHash('sha256').update(input).digest('hex');
}

// static file directory
app.use(express.static(path.join(__dirname, "public")));

// parse application/json
app.use(bodyParser.json());

// parse application/x-www-form-urlencoded
app.use(express.json())
app.use(express.urlencoded());

//set view engine to use ejs templates
app.set("view engine", "ejs");

// set root page to index.ejs and pass in the title of the webpage
app.get("/", function (req, res) {
  let title = "Blog Website";
  res.render("index", { title: title });
});

// render register page
app.get("/register", function (req, res) {
  res.render("register");
});

// render login page
app.get("/login", function (req, res) {
  res.render("login");
});

// register user function
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const salt = randomBytes(16).toString('hex');
  const hashedPassword = hash(password + salt);

  // insert user into database
  try {
    const client = new Pool(config);
    const result = await client.query(
      "INSERT INTO users (username, email, password, salt) VALUES ($1, $2, $3, $4) RETURNING *",
      [username, email, hashedPassword, salt]
    );

    res.redirect("/login");
  }
  catch (err) {
    console.log(err);
    res.send("Email or username already exists, please try loggin in.");
    setTimeout(() => {
      res.redirect('/login');
    }, 2000)
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port: http://localhost:${PORT}`);
});