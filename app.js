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

const jsonParser = bodyParser.json();

// static file directory
app.use(express.static(path.join(__dirname, "public")));
// parse application/json
app.use(bodyParser.json());

//set view engine to use ejs templates
app.set("view engine", "ejs");

// set root page to index.ejs and pass in the title of the webpage
app.get("/", function (req, res) {
  let title = "Blog Website";
  res.render("index", { title: title });
});
