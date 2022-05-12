const env = process.env.NODE_ENV || "development"; // for app.js to connect to postgresQL
const express = require("express");
const articleRouter = require("./routes/articles");
const app = express();
const ejs = require("ejs");
const PORT = 5000;
const path = require("path");
const config = require("./config.js")[env];
const Pool = require("pg").Pool;
const bodyParser = require("body-parser");
const { json, jsonp } = require("express/lib/response");
const req = require("express/lib/request");
const { createHash, scryptSync, randomBytes } = require('crypto');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const helmet = require("helmet");


//Middleware

// allow the app to use cookieparser
app.use(helmet());

var sess;

// create hashing function
function hash(input) {
    return createHash('sha256').update(input).digest('hex');
}

// parse application/x-www-form-urlencoded
app.use(express.json())
app.use(express.urlencoded());

//use router for articles   
app.use("/articles", articleRouter);

// static file directory
app.use(express.static(path.join(__dirname, "public")));

//cookie
app.use(cookieParser());

// parse application/json
app.use(bodyParser.json());



// session
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false,
}));


//cookie
app.get('/check', (req, res) => {
    res.cookie(`Cookie token name`, `encrypted cookie string Value`);
    res.send('Cookie have been saved successfully');
});
//set view engine to use ejs templates
app.set("view engine", "ejs");

// set root page to index.ejs
app.get("/", function(req, res) {
    let title = "Blog Website";
    let articles = []
    //fetch blogs from database
    const client = new Pool(config);
    client.query( "SELECT * FROM blogs ORDER BY created_at DESC")
    .then(result => {
        console.log(result['rows']);
        articles = result['rows']
        // res.render("articles/blog", {article: result.rows[0]});
        res.render("index", { articles: articles, title: title });
    }).catch(err => {
        console.log(err);
        // if error then redirect to home page
        res.redirect("/");
    })
});

// render register page
app.get("/register", function(req, res) {
    res.render("register");
});

// render login page
app.get("/login", function(req, res) {
    res.render("login");
});


// register user function
app.post("/register", async(req, res) => {
    const { username, email, password, twofa } = req.body;
    const salt = randomBytes(16).toString('hex');
    const hashedPassword = hash(password + salt);

    // insert user into database
    try {
        const client = new Pool(config);
        const result = await client.query(
            "INSERT INTO users (username, email, password, salt, twofa) VALUES ($1, $2, $3, $4, $5) RETURNING *", 
            [username, email, hashedPassword, salt, twofa]
        );

        res.render('register', { record: "user succesfully updated::" + email });
        // res.redirect("/login");
    } catch (err) {
        console.log(err);
        res.render('register', { record: "Email or username already exists, please try loggin in" });
        // res.send("Email or username already exists, please try loggin in.");
    }
});

// login verification function
app.post('/login', async(req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const pool = new Pool(config);
    const client = await pool.connect();
    // const q = `SELECT user_id, username, email, password, salt	FROM public.users where email='${email}' `;
    // const q = "SELECT user_id, username, email, password, salt	FROM public.users where email=$1",[email];

    await client.query("SELECT user_id, username, email, password, salt	FROM public.users where email=$1", [email]).then(results => {
        client.release();
        const get_salt = results.rows[0].salt;
        const hashedPassword_c = hash(password + get_salt);
        //const q2 = `SELECT user_id, username, email, password, salt	 FROM public.users where email='${email}' and password='${hashedPassword_c}'`;
        //const q2 = "SELECT user_id, username, email, password, salt	 FROM public.users where email=$1 and password=$2", [email, hashedPassword_c];results_c
        client.query("SELECT user_id, username, email, password, salt FROM public.users where email=$1 and password=$2", [email, hashedPassword_c]).then(results_c => {
            if (results_c.rowCount == '1') {
               // console.log('email or username is not correct')

                sess = req.session;
                sess.id = req.session.id;
                l_id = results_c.rows[0].user_id
                res.render('/', { login_ss: l_id });

            } else {

                res.render('Login', { login_ss: 'Email ID or Password is wrong' });
            }

        })

        //console.log(get_salt);
        //res.render('users', { record: data });

    }).catch(err => {
        console.log('email or username is not correct')

        res.render('Login', { login_ss: 'Email ID or Password is wrong' });
    })
});


// logout code
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return console.log(err);
        }
        res.render('Login');
        //res.redirect('/');
    });
});


app.listen(PORT, () => {
    console.log(`Server running on port: http://localhost:${PORT}`);
});