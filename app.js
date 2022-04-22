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
const { createHash, scryptSync, randomBytes } = require('crypto');
const session = require('express-session');
const cookieParser = require('cookie-parser');


var sess;
// create hashing function
function hash(input) {
    return createHash('sha256').update(input).digest('hex');
}

// static file directory
app.use(express.static(path.join(__dirname, "public")));


//cookie
app.use(cookieParser());

// parse application/json
app.use(bodyParser.json());

// parse application/x-www-form-urlencoded
app.use(express.json())
app.use(express.urlencoded());

// session
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false,
}));


//cookie
app.get('/', (req, res) => {
    res.cookie(`Cookie token name`, `encrypted cookie string Value`, {
        maxAge: 5000,
        // expires works the same as the maxAge
        expires: new Date('01 12 2022'),
        secure: true,
        httpOnly: true,
        sameSite: 'lax'
    });
    res.send('Cookie have been saved successfully');
});
//set view engine to use ejs templates
app.set("view engine", "ejs");

// set root page to index.ejs and pass in the title of the webpage
app.get("/", function(req, res) {
    let title = "Blog Website";
    res.render("index", { title: title });
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
            "INSERT INTO users (username, email, password, salt, twofa) VALUES ($1, $2, $3, $4, $5) RETURNING *", [username, email, hashedPassword, salt, twofa]
        );
        // var f = "user succesfully updated" + req.body.email;
        //console.log(f);
        res.render('register', { record: "user succesfully updated::" + email });
        // res.redirect("/login");
    } catch (err) {
        console.log(err);
        res.render('register', { record: "Email or username already exists, please try loggin in" });
        // res.send("Email or username already exists, please try loggin in.");
    }
});

// login page
app.post('/login', async(req, res, next) => {
    //console.log(req.body.email);
    const email = req.body.email;
    const password = req.body.password;
    const pool = new Pool(config);
    const client = await pool.connect();
    const q = `SELECT user_id, username, email, password, salt	FROM public.users where email='${email}'`;

    await client.query(q).then(results => {
        client.release();
        const get_salt = results.rows[0].salt;

        const hashedPassword_c = hash(password + get_salt);
        const q2 = `SELECT user_id, username, email, password, salt	
        FROM public.users where email='${email}' and password='${hashedPassword_c}'`;
        client.query(q2).then(results_c => {
            if (results_c.rowCount == '1') {
                //req.session.user = { 'id': 123 };

                //req.session = 875278547825478254;
                sess = req.session;
                sess.id = req.session.id;

                res.render('write_blog', { login_ss: 'User successfully Login ' + sess.id });

                //console.log(req.session);
            } else {
                //  console.log('wrong');
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