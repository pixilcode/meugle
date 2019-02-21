const express = require("express");
const path = require("path");
const database = require("./database/database");
const body_parser = require("body-parser");

// Run tests
database.run_tests();

// Load the database
let user_db = new database.UserDB(path.join(__dirname, "..", "data", "users.json"));

// The amount of time between saving (in ms)
const save_interval = 300000;

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

app.get("/register", (req, res) => {
    res.sendFile(get_public("register.html"));
})

app.get("/dashboard", (req, res) => {
    res.sendFile(get_public("dashboard.html"));
})

app.post("/login", (req, res) => {
    let { username, password } = req.body;
    let response = user_db.request({username, password})
        .validate(({username}, db) => db.has_user(username))
        .validate(({username, password}, db) => db.match(username, password))
        .modify_db(({username, password}, db) => db.login(username, password))
        .check_server(({username}, db) => db.is_logged_in(username))
        .then(({username}, output, db) => (
            {user_id: db.get_user_id(username)}
        ));
    
    user_db = response.get_db();

    console.log(JSON.stringify(response.to_json()));

    res.send(JSON.stringify(response.to_json()));
});

app.post("/register", (req, res) => {
    let { username, password } = req.body;
    let response = user_db.request({username, password})
        .then(({username}, output, db) => ({user_taken: db.has_user(username)}))
        .modify_db(({username, password}, db) => {
            let salt = crypto.randomBytes(16).toString("hex");
            return db.add_user(username, password, salt)
                .login(username, password);
        })
        .check_server(({username}, db) => db.is_logged_in(username))
        .then(({username}, output, db) => {
            return {
                user_id: db.get_user_id(username),
                ...output
            }
        });
    
    user_db = response.get_db();

    console.log(JSON.stringify(response.to_json()));

    res.send(JSON.stringify(response.to_json()));
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

// TODO Need to lock db when saving
let save = setInterval(() => {
    console.log();
    console.log("Saving...")
    user_db.save();
    console.log("Saved!");
}, save_interval);

function get_public(loc) {
    return path.join(__dirname, "..", "public", loc);
}