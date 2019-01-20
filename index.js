const express = require("express");
const json_parser = require("body-parser");
const path = require("path");

// Testing framework
const test = require("./public/js/test");
const Test = test.Test;
const TestSuite = test.TestSuite;
const assert = test.assert;
const assert_eq = test.assert_eq;
const assert_neq = test.assert_neq;

const app = express();
const port = 8080;
app.listen(port, () => console.log("Listening on port 8080..."));

app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
    req.request_time = Date.now();
    next();
});
//app.use(json_parser.json());

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, "404.html"));
});

app.use((error, req, res, next) => {
    res.status(500).sendFile(path.join(__dirname, "500.html"));
});