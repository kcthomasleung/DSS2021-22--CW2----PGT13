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

// register user function
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const salt = randomBytes(16).toString('hex');
  console.log(salt)
  const hashedPassword = hash(password + salt);
})

app.listen(PORT, () => {
  console.log(`Server running on port: http://localhost:${PORT}`);
});