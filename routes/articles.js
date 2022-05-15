const env = process.env.NODE_ENV || "development"; // for app.js to connect to postgresQL
const express = require('express');
const router = express.Router();
const Pool = require("pg").Pool;
const config = require("../config.js")[env];

router.get('/', (req, res) => {
    res.render('/');
})

router.get('/create_blog', (req, res) => {
    res.render('articles/create_blog');
})

// render article page
router.get("/:id", function(req, res) {
    const client = new Pool(config);
    client.query( "SELECT * FROM blogs WHERE blog_id = $1", [req.params.id])
    .then(result => {
        res.render("articles/blog", {article: result.rows[0]});
    }).catch(err => {
        console.log(err);
        // if error then redirect to home page
        res.redirect("/");
    })
})

router.post('/new_blog', async (req, res) => {
    const { title, content } = req.body;
    const dateCreated = new Date();
    const user_id = 7
    const client = new Pool(config);
    client.query(
        "INSERT INTO blogs (title, content, user_id, created_at) VALUES ($1, $2, $3, $4) RETURNING *",
        [title, content, user_id, dateCreated]
    ).then(results => {
        const blog_id = results.rows[0].blog_id
        res.render(`articles/:${blog_id}`, { record: "article succesfully updated::" + title });
    }).catch(err => {
        console.log(err);
        res.render('articles/create_blog', { record: "article failed to update::" + title });
    })
})

module.exports = router;