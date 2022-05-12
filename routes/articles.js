const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('/');
})

router.get('/create_blog', (req, res) => {
    res.render('articles/create_blog');
})

router.post('/', (req, res) => {
    const { title, content } = req.body;
    
})

module.exports = router;