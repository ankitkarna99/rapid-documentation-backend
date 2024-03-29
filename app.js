const express = require("express");

//New Express App
const app = express();

//Enable JSON Data Transfer in Node.js
app.use(express.json());
//Allow Nested Objects in Data
app.use(express.urlencoded({ extended: true }));

//Allow Cross Origin Requests
app.use(require("cors")());

//Bring in the routes
app.use("/book", require("./routes/book"));

module.exports = app;
