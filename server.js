const express = require("express");
const path = require("path");
const backend = require("./backend");

// Run tests
backend.run_tests();

const app = express();
const port = 8080;
app.listen(port, () => console.log("Listening on port 8080..."));

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
    res.send(backend.validate(req)); // TODO make working validation function
});

app.get("/:type(js|css|res)/:file", (req, res) => {
    res.sendFile(get_public(req.params.type + "/" + req.params.file));
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, "404.html"));
});

app.use((error, req, res, next) => {
    res.status(500).sendFile(path.join(__dirname, "500.html"));
});

function get_public(loc) {
    return path.join(__dirname, "public", loc);
}