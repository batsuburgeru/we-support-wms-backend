const dotenv = require('dotenv');
dotenv.config()

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  development: {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
<<<<<<< HEAD
      timezone: 'UTC',
=======
      timezone: 'Z',
>>>>>>> 7899c7ef928283b1b6fcd8ea3dd4be6a081f8817
    },
    migrations: {
      directory: "./db/migrations",
    }
  }
};