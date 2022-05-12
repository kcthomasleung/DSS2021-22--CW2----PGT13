const env = process.env.NODE_ENV || "development"; // for app.js to connect to postgresQL
const express = require("express");
const app = express();
const ejs = require("ejs");
const PORT = 5000;
const path = require("path");
const config = require("./config.js")[env];
const Pool = require("pg").Pool;
const bodyParser = require("body-parser");
const { json, jsonp, cookie } = require("express/lib/response");
const req = require("express/lib/request");
const { createHash, scryptSync, randomBytes } = require('crypto');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const helmet = require("helmet");
const nodemailer = require('nodemailer');

// allow the app to use cookieparser
app.use(helmet());
app.set('trust proxy', 1);
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
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//app.use(express.urlencoded());

// session
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    cookie: { secure: true }
}));
//set view engine to use ejs templates
app.set("view engine", "ejs");


//cookie
// app.get('/check', (req, res) => {
//     res.cookie(`Cookie token name`, `encrypted cookie string Value`);
//     res.send('Cookie have been saved successfully');
// });
login_auth = '';


var transporter = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    service: 'gmail',
    port: 2525,
    auth: {
        user: "fdc94e5a290f42",
        pass: "181ce06a74345f"
    }
});
var message = {
    from: "noreplay@email.com",
    to: "pardeep.nsr@gamil.com",
    subject: "Subject",
    text: "Hello SMTP Email"
}

// const redirectLogin = (req, res, next) => {
//     if (!req.session.id) {
//         res.redirect('login');


//     } else {

//         next();
//     }
// }
// const redirectindex = (req, res, next) => {
//     if (req.session.id) {
//         //console.log('jj');
//         auth = '<a href = "/logout" > Logout </a>';
//         // res.render('index', { login_auth: auth });
//         // res.redirect('/');


//     } else {

//         next();
//     }
// }

// set root page to index.ejs and pass in the title of the webpage
app.get("/", function(req, res) {
    //console.log(req.cookies.session_id);

    //console.log(req.session);
    if (req.cookies.session_id) {
        auth = '<a href = "/logout" > Logout </a>';
        res.render('index', { login_auth: auth });

    } else {
        auth = '<a href="/login">Login</a>';
        res.render('index', { login_auth: auth });

    }
    // let title = "Blog Website";

    //  res.render("index", { title: title });
});

// render register page
app.get("/register", function(req, res) {
    if (req.cookies.session_id) {
        auth = '<a href = "/logout" > Logout </a>';
        res.render('register', { login_auth: auth });

    } else {
        auth = '<a href="/login">Login</a>';
        res.render('register', { login_auth: auth });

    }
    // res.render("register");
});

// render login page
app.get("/login", function(req, res) {
    if (req.cookies.session_id) {
        auth = '<a href = "/logout" > Logout </a>';
        res.render('write_blog', { login_auth: auth });

    } else {
        auth = '<a href="/login">Login</a>';
        res.render('login', { login_auth: auth });

    }
    // res.render("login");
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
    // const q = `SELECT user_id, username, email, password, salt	FROM public.users where email='${email}' `;
    // const q = "SELECT user_id, username, email, password, salt	FROM public.users where email=$1",[email];

    await client.query("SELECT user_id, username, email, password, salt	FROM public.users where email=$1", [email]).then(results => {
        client.release();
        const get_salt = results.rows[0].salt;

        const hashedPassword_c = hash(password + get_salt);
        //const q2 = `SELECT user_id, username, email, password, salt	 FROM public.users where email='${email}' and password='${hashedPassword_c}'`;
        //const q2 = "SELECT user_id, username, email, password, salt	 FROM public.users where email=$1 and password=$2", [email, hashedPassword_c];
        client.query("SELECT user_id, username, email, password, salt	 FROM public.users where email=$1 and password=$2", [email, hashedPassword_c]).then(results_c => {
            if (results_c.rowCount == '1') {
                var write_user_id = results_c.rows[0].user_id;
                // secure_user_write_id = hash(results_c.rows[0].user_id);
                // console.log(secure_user_write_id);
                sess = req.session;
                sess.id = req.session.id;
                res.locals.id = req.session.id;

                transporter.sendMail(message, function(err, info) {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log(info);
                    }
                });

                let session_id1 = res.cookie('session_id', sess.id, { maxAge: 900000, secure: true, httpOnly: true });
                let write_id = res.cookie('write_id', write_user_id, { maxAge: 900000, secure: true, httpOnly: true });
                //  console.log(res.locals.id);
                //  console.log(req.headers.cookie);
                //localStorage.setItem('key', 'New Value');
                // sessionStorage.getItem('seesion_id', id);
                //localStorage.setItem('seesion_id', id);
                //  res.cookie('pardeep', 'kjghjhv', { maxAge: 900000, httpOnly: true });
                // res.cookie("username", username);
                log_out = "<a href = '/logout' > Logout </a>";
                return res.render('write_blog', { log_out: log_out });


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
        // console.log(session_id);
        // console.log(session_id);
        res.clearCookie("session_id");
        res.clearCookie("write_id");

        auth = '<a href="/login">Login</a>';
        res.render('index', { login_auth: auth });

        //res.redirect('/');
    });

});



app.listen(PORT, () => {
    console.log(`Server running on port: http://localhost:${PORT}`);
});