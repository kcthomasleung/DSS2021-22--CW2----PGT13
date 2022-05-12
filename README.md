# Installation

To run the code please install all the required dependencies by running:
`npm install`

A local database is required to be created using postgresql. Run blog.sql in your local database to create the required tables.

create a file named config.js in the root directory in the following format:

```var config = {
    development: {
      user: "yourusername",
      database: "blog-website",
      password: "yourpassword",
      host: "localhost",
      port: 5432,
    },
    production: {
      user: "yourusername",
      database: "yourdatabasename",
      password: "your password",
      host: "yourhost",
      port: yourport,
      idleTimeoutMillis: 3000
    },
  };

  module.exports = config;
```
