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
// app.use("/articles", articleRouter);

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

login_auth = '';
msg = '';
verified = '';
article = '';
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

// set root page to index.ejs
app.get("/", function (req, res) {
    let title = "Blog Website";
    let articles = [];
    if (req.cookies.session_id) {
        const decryptedString = cryptr.decrypt(req.cookies.user_id);
        auth = '<a href = "/logout" > Logout </a>';

        //fetch blogs from database
        const client = new Pool(config);
        client.query("SELECT * FROM blogs ORDER BY created_at DESC")
            .then(result => {
                articles = result['rows']
                res.setHeader("Content-Security-Policy", "script-src 'none'");
                res.render("index", { articles: articles, title: title, login_auth: auth, session_id: '1', uid: decryptedString, msg: msg });
            }).catch(err => {
                console.log(err);
                // if error then redirect to home page
                res.setHeader("Content-Security-Policy", "script-src 'none'");
                res.redirect("/");
            })
    } else {
        auth = '<a href="/login">Login</a>';
        //fetch blogs from database
        const client = new Pool(config);
        client.query("SELECT * FROM blogs ORDER BY created_at DESC")
            .then(result => {
                articles = result['rows']
                res.setHeader("Content-Security-Policy", "script-src 'none'");
                res.render("index", { articles: articles, title: title, login_auth: auth, msg: '', session_id: '0' });
            }).catch(err => {
                console.log(err);
                // if error then redirect to home page
                res.setHeader("Content-Security-Policy", "script-src 'none'");
                res.redirect("/");
            })
    }
});

// render register page
app.get("/register", function (req, res) {
    if (req.cookies.session_id) {
        auth = '<a href = "/logout" > Logout </a>';
        res.setHeader("Content-Security-Policy", "script-src 'http://localhost:5000/'");
        res.render('register', { login_auth: auth });

    } else {
        auth = '<a href="/login">Login</a>';
        res.setHeader("Content-Security-Policy", "script-src 'http://localhost:5000/'");
        res.render('register', { login_auth: auth });

    }
});

app.get("/verified", function (req, res) {
    if (req.cookies.session_id) {
        auth = '<a href = "/logout" > Logout </a>';
        res.setHeader("Content-Security-Policy", "script-src 'http://localhost:5000/'");
        res.render('register', { login_auth: auth });

    } else {
        auth = '<a href="/login">Login</a>';
        res.setHeader("Content-Security-Policy", "script-src 'http://localhost:5000/'");
        res.render('register', { login_auth: auth });
    }
    // res.render("register");
});

// render login page
app.get("/login", function (req, res) {
    if (req.cookies.session_id) {
        auth = '<a href = "/logout" > Logout </a>';
        res.setHeader("Content-Security-Policy", "script-src 'none'");
        res.render('/', { login_auth: auth });

    } else {
        auth = '<a href="/login">Login</a>';
        res.setHeader("Content-Security-Policy", "script-src 'none'");
        res.render('login', { login_auth: auth });
    }
});

app.post("/verified", async (req, res, next) => {
    const { verified, hid } = req.body;
    const pool = new Pool(config);
    const client = await pool.connect();
    await client.query("SELECT * FROM public.users where user_id=$1 and verify=$2", [hid, verified]).then(verified_login => {
        client.release();
        if (verified_login.rowCount == '1') {
            email = verified_login.rows[0].email;
            sess = req.session;
            sess.id = req.session.id;
            res.locals.id = req.session.id;
            const encryptedString = cryptr.encrypt(req.body.hid);
            //const decryptedString = cryptr.decrypt(encryptedString);
            let session_id1 = res.cookie('session_id', sess.id, { maxAge: 900000, secure: true, httpOnly: true });
            let write_id = res.cookie('user_id', encryptedString, { maxAge: 900000, secure: true, httpOnly: true });
            res.setHeader("Content-Security-Policy", "script-src 'none'");
            res.redirect('/');
        } else {
            var record1 = { 'msg': 'Please Enter Right code', 'hid': req.body.hid, uid: req.body.hid };
            res.setHeader("Content-Security-Policy", "script-src 'none'");
            res.render('verified', { msg: record1 });
        }
    });
});


// register user function
app.post("/register", async (req, res, next) => {
    const { username, email, password, twofa } = req.body;
    const salt = randomBytes(16).toString('hex');
    const hashedPassword = hash(password + salt);

    // insert user into database
    const client = new Pool(config);
    const result = await client.query("INSERT INTO users (username, email, password, salt, twofa) VALUES ($1, $2, $3, $4, $5) RETURNING *", [username, email, hashedPassword, salt, twofa]).then(results_insert => {
        const write_user_id = results_insert.rows[0].user_id;
        const email = results_insert.rows[0].email;
        sess = req.session;
        sess.id = req.session.id;
        client.query("SELECT * FROM blogs ORDER BY created_at DESC")
            .then(result => {
                articles = result['rows']
                //  articles = result['rows']
                res.locals.id = req.session.id;
                encryptedString = cryptr.encrypt(write_user_id);

                let session_id1 = res.cookie('session_id', sess.id, { maxAge: 900000, secure: true, httpOnly: true });
                let write_id = res.cookie('user_id', encryptedString, { maxAge: 900000, secure: true, httpOnly: true });

                log_out = "<a href = '/logout' > Logout </a>";
                res.setHeader("Content-Security-Policy", "script-src 'none'");
                res.render('index', { articles: articles, msg: "user succesfully register::" + email, login_auth: log_out, session_id: '1', uid: write_user_id });
            });
    }).catch(err => {
        auth = '<a href="/login">Login</a>';
        res.setHeader("Content-Security-Policy", "script-src 'http://localhost:5000/'");
        res.render('register', { record: "Email or username already exists, please try agian", login_auth: auth });
        // res.send("Email or username already exists, please try loggin in.");
    });
});

// login verification function
app.post('/login', async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const pool = new Pool(config);
    const client = await pool.connect();

    await client.query("SELECT user_id, username, email, password, salt	FROM public.users where email=$1", [email]).then(results => {
        // client.release();
        const get_salt = results.rows[0].salt;
        const hashedPassword_c = hash(password + get_salt);
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
                        text: 'Enter four digit code ' + `${val}`
                    }
                    // console.log(message);

                    transporter.sendMail(message, function (err, info) {
                        if (err) {
                            console.log(err);
                        } else {
                            client.query("UPDATE public.users	SET  verify=$1 WHERE user_id=$2", [val, write_user_id]).then(update => {
                                client.release();
                                res.setHeader("Content-Security-Policy", "script-src 'none'");
                                res.render('verified', { verified: write_user_id });
                            });
                        }
                    });

                } else {
                    sess = req.session;
                    sess.id = req.session.id;
                    res.locals.id = req.session.id;
                    client.query("SELECT * FROM blogs ORDER BY created_at DESC").then(result => {
                        articles = result['rows']
                        const encryptedString = cryptr.encrypt(write_user_id);
                        let session_id1 = res.cookie('session_id', sess.id, { maxAge: 900000, secure: true, httpOnly: true });
                        let write_id = res.cookie('user_id', encryptedString, { maxAge: 900000, secure: true, httpOnly: true });

                        log_out = "<a href = '/logout' > Logout </a>";
                        res.setHeader("Content-Security-Policy", "script-src 'none'");
                        return res.render('index', { login_auth: log_out, session_id: '1', articles: articles, uid: write_user_id });

                    });

                    // res.redirect('/');
                }
            } else {
                res.setHeader("Content-Security-Policy", "script-src 'none'");
                res.render('Login', { login_ss: 'Email ID or Password is wrong' });
            }
        });

        //console.log(get_salt);
        //res.render('users', { record: data });

    }).catch(err => {
        console.log('email or username is not correct')
        res.setHeader("Content-Security-Policy", "script-src 'none'");
        res.render('Login', { login_ss: 'Email ID or Password is wrong' });
    })
});


// logout code
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return console.log(err);
        } else {
            res.clearCookie("session_id");
            res.clearCookie("user_id");

            auth = '<a href="/login">Login</a>';
            // res.render('index', { login_auth: auth });
            res.setHeader("Content-Security-Policy", "script-src 'none'");
            res.redirect('/');
        }
    });
});


//articles section ggggg
app.get('/create_blog', (req, res) => {
    let title = "Blog Website";
    let articles = [];
    if (req.cookies.user_id) {
        auth = '<a href="/logout">Logout</a>';
        res.render('create_blog', { login_auth: auth });
    } else {
        auth = '<a href="/login">Login</a>';
        //fetch blogs from database
        const client = new Pool(config);
        client.query("SELECT * FROM blogs ORDER BY created_at DESC")
            .then(result => {
                articles = result['rows']
                res.setHeader("Content-Security-Policy", "script-src 'none'");
                res.render("index", { articles: articles, title: title, login_auth: auth, msg: 'Please login first', session_id: '0' });
            }).catch(err => {
                console.log(err);
                // if error then redirect to home page
                res.setHeader("Content-Security-Policy", "script-src 'none'");
                res.redirect("/");
            })
    }
})

app.get('/delete/:id', function (req, res, next) {
    const blog1_id = req.params.id;
    if (req.cookies.user_id) {
        const client = new Pool(config);
        sess = req.session;
        client.query("DELETE FROM public.blogs WHERE blog_id=$1", [blog1_id]).then(result => {
            res.setHeader("Content-Security-Policy", "script-src 'none'");
            res.redirect('/');
        });
    } else {
        res.redirect('/');
    }
});

app.get('/edit_blog/:id', function (req, res, next) {
    const blog1_id = req.params.id;
    if (req.cookies.session_id) {
        const client = new Pool(config);
        client.query("SELECT * FROM blogs where blog_id=$1", [blog1_id])
            .then(result => {
                blog_id = result.rows[0].blog_id;
                title = result.rows[0].title;
                content = result.rows[0].content;
                user_id = result.rows[0].user_id;
                auth = '<a href = "/logout" > Logout </a>';
                res.setHeader("Content-Security-Policy", "script-src 'none'");
                res.render('edit_view', { login_auth: auth, blog_id: blog_id, title: title, content: content, user_id: user_id });
            });
    } else {
        res.setHeader("Content-Security-Policy", "script-src 'none'");
        res.redirect('/');
    }
});

app.post('/edit_blog/update', async (req, res, next) => {
    console.log(req.body);

    if (req.cookies.user_id) {
        const client = new Pool(config);
        client.query(`UPDATE public.blogs	SET  title='${req.body.title}', content='${req.body.content}'	WHERE user_id='${req.body.user_id}' AND blog_id='${req.body.blog_id}'`).then(result => {
            client.query("SELECT * FROM blogs where user_id=$1 AND blog_id=$2", [req.body.user_id, req.body.blog_id])
                .then(update_result => {
                    auth = '<a href = "/logout" > Logout </a>';
                    res.setHeader("Content-Security-Policy", "script-src 'none'");
                    res.render('blog', { login_auth: auth, title: update_result.rows[0].title, content: update_result.rows[0].content });
                });
        });
    } else {
        res.setHeader("Content-Security-Policy", "script-src 'none'");
        res.redirect('/');
    }
});


// render page for specific blog
app.get('/blog/:id', function (req, res) {
    const client = new Pool(config);
    client.query("SELECT * FROM blogs WHERE blog_id = $1", [req.params.id])
        .then(result => {
            auth = '<a href = "/logout" > Logout </a>';
            res.setHeader("Content-Security-Policy", "script-src 'none'");
            res.render('blog', { article: result.rows[0], login_auth: auth });
        }).catch(err => {
            console.log(err);
            res.setHeader("Content-Security-Policy", "script-src 'none'");
            // if error then redirect to home page
            res.redirect('/');
        })
})

// function to handle post request to create a new blog
app.post('/new_blog', async (req, res, next) => {
    let title1 = "Blog Website";
    if (req.cookies.user_id) {
        const { title, content } = req.body;
        const dateCreated = new Date();
        let articles = [];
        const decryptedString = cryptr.decrypt(req.cookies.user_id);
        const user_id = decryptedString;
        const client = new Pool(config);
        client.query(
            "INSERT INTO blogs (title, content, user_id, created_at) VALUES ($1, $2, $3, $4) RETURNING *", [title, content, user_id, dateCreated]
        ).then(results => {
            const blog_id = results.rows[0].blog_id;
            const articles = results.rows[0];
            auth = '<a href = "/logout" > Logout </a>';
            res.setHeader("Content-Security-Policy", "script-src 'none'");
            res.render("blog", { article: articles, title: title1, login_auth: auth });
        })
    } else {
        res.setHeader("Content-Security-Policy", "script-src 'none'");
        res.render("blog", { msg: 'Please login first' });
    }
})

app.post('/search', async (req, res, next) => {

    const client = new Pool(config);
    client.query("SELECT * FROM blogs WHERE title like $1", [req.body.search_key])
        .then(result => {
            if (req.cookies.user_id) {
                auth = '<a href = "/logout" > Logout </a>';
                res.setHeader("Content-Security-Policy", "script-src 'none'");
                res.render("blog", { article: result.rows[0], login_auth: auth });
            } else {
                auth = '<a href = "/login" > Login </a>';
                res.setHeader("Content-Security-Policy", "script-src 'none'");
                res.render("blog", { article: result.rows[0], login_auth: auth });
            }
        });


});
app.post('/blog/search', async (req, res, next) => {

    const client = new Pool(config);
    client.query("SELECT * FROM blogs WHERE title like $1", [req.body.search_key])
        .then(result => {
            if (req.cookies.user_id) {
                auth = '<a href = "/logout" > Logout </a>';
                res.setHeader("Content-Security-Policy", "script-src 'none'");
                res.render("blog", { article: result.rows[0], login_auth: auth });
            } else {

                auth = '<a href = "/login" > Login </a>';
                res.setHeader("Content-Security-Policy", "script-src 'none'");
                res.render("blog", { article: result.rows[0], login_auth: auth });

            }
        });
});

app.listen(PORT, () => {
    console.log(`Server running on port: http://localhost:${PORT}`);
});

module.exports = app    // for testing