const express = require("express");
const path = require("path");
const backend = require("./backend");
const database = require("./database");
const body_parser = require("body-parser");

// Run tests
backend.run_tests();
database.run_tests();

// Load the database
const user_db = database.user_db(path.join(__dirname, "data", "users.json"));

const app = express();
const port = 8080;
app.listen(port, () => console.log("Listening on port 8080..."));

app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.sendFile(get_public("index.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(get_public("login.html"));
});

app.post("/register", (req, res) => {
    backend.register(req); // TODO make working register function
})

app.post("/validate", (req, res) => {
    let data = req.body;
    let result = backend.validate(data.username, data.password, user_db);
    res.send(JSON.stringify(result));
});

app.get("/:type(js|css|res)/:file", (req, res) => {
    res.sendFile(get_public(req.params.type + "/" + req.params.file));
});

app.use((req, res) => {
    res.status(404).sendFile(get_public("404.html"));
});

app.use((error, req, res, next) => {
    res.status(500).sendFile(get_public("500.html"));
});

function get_public(loc) {
    return path.join(__dirname, "public", loc);
}