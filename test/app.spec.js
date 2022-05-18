const app = require('../app');
const chai = require('chai');
const chaiHttp = require('chai-http');

chai.should()

chai.use(chaiHttp);

// Test the /GET route
describe('/GET app', () => {
    it('it should GET all the blogs', (done) => {
        chai.request(app)
            .get('/')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                done();
            });
    });
});

//Test the /GET/register route
describe('/GET/register app', () => {
    it('it should GET the register page', (done) => {
        chai.request(app)
            .get('/register')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                done();
            });
    });
});


//Test the /GET/login route
describe('/GET/login app', () => {
    it('it should GET the login page', (done) => {
        chai.request(app)
            .get('/login')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                done();
            });
    });
})

// Test the /GET/blog/:id route
describe('/GET/blog/:id app', () => {
    it('it should GET a blog by the given id', (done) => {
        let blog = {
            title: "I am a test blog",
            content: "I am a test blog",
            id: 2
        };
        chai.request(app)
            .get('/blog/' + blog.id)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                done();
            });
    });
});

// Test the /POST/new_blog route
describe('/POST/new_blog', () => {
    it('it should POST a blog', (done) => {
        let blog = {
            title: "test title",
            content: "I am a test blog",
            user_id: 100,
            created_at: "2018-01-01"
        }
        chai.request(app)
            .post('/new_blog')
            .send(blog)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('errors');
                res.body.errors.should.have.property('title');
                res.body.errors.title.should.have.property('kind').eql('required');
                done();
            });
    });
});

