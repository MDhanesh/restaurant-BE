const { MongoClient } = require("mongodb");
require("dotenv").config();

const client = new MongoClient(process.env.MONGODB_URL);

const db = client.db("Pizza");

module.exports = { client, db };
