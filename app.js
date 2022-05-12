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
const { json, jsonp, cookie } = require("express/lib/response");
const req = require("express/lib/request");
const { createHash, scryptSync, randomBytes } = require('crypto');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const helmet = require("helmet");
require('dotenv').config();
const nodemailer = require('nodemailer');
const Cryptr = require('cryptr');
const cryptr = new Cryptr('myTotallySecretKey');



// allow the app to use cookieparser
app.use(helmet());
app.set('trust proxy', 1);
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
msg = '';
verified = '';
// articles = [];
var transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    // host: "smtp.mailtrap.io",
    // service: 'gmail',
    // port: 2525,
    auth: {
        user: "xnydsu@gmail.com",
        pass: "X12345678"
    }
});


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

// set root page to index.ejs
app.get("/", function(req, res) {
    let title = "Blog Website";
    let articles = [];
    if (req.cookies.session_id) {
        auth = '<a href = "/logout" > Logout </a>';

        //fetch blogs from database
        const client = new Pool(config);
        client.query( "SELECT * FROM blogs ORDER BY created_at DESC")
        .then(result => {
            console.log(result['rows']);
            articles = result['rows']
            res.render("index", { articles: articles, title: title, login_auth: auth });
        }).catch(err => {
            console.log(err);
            // if error then redirect to home page
            res.redirect("/");
        })
    } else {
        auth = '<a href="/login">Login</a>';
        //fetch blogs from database
        const client = new Pool(config);
        client.query( "SELECT * FROM blogs ORDER BY created_at DESC")
        .then(result => {
            console.log(result['rows']);
            articles = result['rows']
            res.render("index", { articles: articles, title: title, login_auth: auth });
        }).catch(err => {
            console.log(err);
            // if error then redirect to home page
            res.redirect("/");
        })
    }
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
app.get("/verified", function(req, res) {
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
        res.render('/', { login_auth: auth });

    } else {
        auth = '<a href="/login">Login</a>';
        res.render('login', { login_auth: auth });
    }
    // res.render("login");
});

app.post("/verified", async(req, res, next) => {
    const { verified, hid } = req.body;
    const pool = new Pool(config);
    const client = await pool.connect();
    //  gg = `SELECT * FROM public.users where user_id='${hid}' and verify='${verified}'`;
    await client.query("SELECT * FROM public.users where user_id=$1 and verify=$2", [hid, verified]).then(verified_login => {
        client.release();
        if (verified_login.rowCount == '1') {

            sess = req.session;
            sess.id = req.session.id;
            res.locals.id = req.session.id;
            const encryptedString = cryptr.encrypt(req.body.hid);
            //const decryptedString = cryptr.decrypt(encryptedString);
            let session_id1 = res.cookie('session_id', sess.id, { maxAge: 900000, secure: true, httpOnly: true });
            let write_id = res.cookie('user_id', encryptedString, { maxAge: 900000, secure: true, httpOnly: true });
            res.redirect('/');
        } else {

            var record1 = { 'msg': 'Please Enter Right code', 'hid': req.body.hid };
            return res.render('verified', { msg: record1 });
        }
    });
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
        // client.release();
        const get_salt = results.rows[0].salt;
        const hashedPassword_c = hash(password + get_salt);
        //const q2 = `SELECT user_id, username, email, password, salt	 FROM public.users where email='${email}' and password='${hashedPassword_c}'`;
        //const q2 = "SELECT user_id, username, email, password, salt	 FROM public.users where email=$1 and password=$2", [email, hashedPassword_c];
        client.query("SELECT user_id, username, email, password, salt, twofa	 FROM public.users where email=$1 and password=$2", [email, hashedPassword_c]).then(results_c => {
            if (results_c.rowCount == '1') {
                // console.log(results_c.rows[0]);
                var write_user_id = results_c.rows[0].user_id;
                // const encrpt_id = hash(write_user_id);
                //console.log(encrpt_id);
                var email_v = results_c.rows[0].email;
                //console.log(results_c.rows[0].twofa);
                const verified = results_c.rows[0].twofa;
                if (verified == true) {

                    const val = Math.floor(1000 + Math.random() * 9000);
                    var message = {
                            from: "noreply@gmail.com",
                            to: email_v,
                            subject: "Please Enter the 4 digit code in blogs website ",
                            text: `${val}`
                        }
                        // console.log(message);

                    transporter.sendMail(message, function(err, info) {
                        if (err) {
                            console.log(err);
                        } else {
                            // gg = `UPDATE public.users	SET  verify='${val}'	WHERE user_id='${write_user_id}'`;
                            //console.log(gg);
                            client.query(`UPDATE public.users	SET  verify='${val}'	WHERE user_id='${write_user_id}'`).then(update => {
                                client.release();
                                return res.render('verified', { verified: write_user_id });
                                // console.log('update');
                            });
                            // console.log(info);

                            //  
                        }
                    });

                } else {
                    // secure_user_write_id = hash(results_c.rows[0].user_id);
                    // console.log(secure_user_write_id);
                    sess = req.session;
                    sess.id = req.session.id;
                    res.locals.id = req.session.id;
                    // console.log(message);
                    const encryptedString = cryptr.encrypt(write_user_id);

                    let session_id1 = res.cookie('session_id', sess.id, { maxAge: 900000, secure: true, httpOnly: true });
                    let write_id = res.cookie('user_id', encryptedString, { maxAge: 900000, secure: true, httpOnly: true });
                    //  console.log(res.locals.id);
                    //  console.log(req.headers.cookie);
                    //localStorage.setItem('key', 'New Value');
                    // sessionStorage.getItem('seesion_id', id);
                    //localStorage.setItem('seesion_id', id);
                    //  res.cookie('pardeep', 'kjghjhv', { maxAge: 900000, httpOnly: true });
                    // res.cookie("username", username);
                    log_out = "<a href = '/logout' > Logout </a>";
                    return res.render('index', { log_out: log_out });
                }
            } else {
                res.render('Login', { login_ss: 'Email ID or Password is wrong' });
            }
        });

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
        }else{
            res.clearCookie("session_id");
            res.clearCookie("user_id");

            auth = '<a href="/login">Login</a>';
            // res.render('index', { login_auth: auth });
            res.redirect('/');

        }
    });
});


app.listen(PORT, () => {
    console.log(`Server running on port: http://localhost:${PORT}`);
});