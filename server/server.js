const express = require("express");
const path = require("path");
const database = require("./database/database");
const body_parser = require("body-parser");
const crypto = require("crypto");

// Run tests
database.run_tests();

// Load the database
let user_db = new database.UserDB(path.join(__dirname, "..", "data", "users.json"));

// The amount of time between saving (in ms)
// const save_interval = 300000; // Production
const save_interval = 60000; // Testing

// The amount of time before cookies expire (in days)
const expr_date = 7;

const app = express();
const port = 8080;
app.listen(port, () => console.log("Listening on port 8080..."));

app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.sendFile(get_public("index.html"));
});

app.get("/(login|register)", (req, res, next) => {
    if(req.headers.cookie) {
        let cookies = parse_cookies(req.headers.cookie);
        if(cookies.user_id &&
            user_db.is_valid_id(cookies.user_id))
            res.redirect("/dashboard");
        else
            next();
    } else
        next();
});

app.get("/login", (req, res) => {
    res.sendFile(get_public("login.html"));
});

app.get("/register", (req, res) => {
    res.sendFile(get_public("register.html"));
})

app.get("/dashboard", (req, res) => {
    // TODO Do some work here to fix the page and personalize it
    // TODO Check if there is a valid user_id
    res.sendFile(get_public("dashboard.html"));
})

app.post("/login", (req, res) => {
    let { username, password } = req.body;
    let response = user_db.request({username, password})
        .validate(({username}, db) => db.has_user(username))
        .validate(({username, password}, db) => db.match(username, password))
        .modify_db(({username, password}, db) => db.login(username, password))
        .check_db(({username}, db) => db.is_logged_in(username))
        .then(({username}, output, db) => (
            {user_id: db.get_user_id(username)}
        ));
    
    user_db = response.get_db();

    let cookie = generate_cookie("user_id", response.to_json().user_id);
    res.setHeader("Set-Cookie", cookie);
    
    res.send(JSON.stringify(response.to_json()));
});

app.post("/register", (req, res) => {
    let { username, password } = req.body;
    let response = user_db.request({username, password})
        .validate(({username}, db) => !db.has_user(username))
        .modify_db(({username, password}, db) => {
            let salt = crypto.randomBytes(16).toString("hex");
            return db.add_user(username, password, salt)
                .login(username, password);
        })
        .check_db(({username}, db) => db.is_logged_in(username))
        .then(({username}, output, db) => {
            return {
                user_id: db.get_user_id(username),
                ...output
            }
        });
    
    user_db = response.get_db();

    let cookie = generate_cookie("user_id", response.to_json().user_id);
    res.setHeader("Set-Cookie", cookie);
    
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
setInterval(() => {
    console.log();
    console.log("Saving...");
    user_db.save();
    console.log("Saved!");
}, save_interval);

function parse_cookies(cookies) {
    let c = {};

    cookies && cookies.split(";").forEach(cookie => {
        let parts = cookie.split("=");
        c[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return c;
}

function generate_cookie(name, value) {
    let expire = new Date();
    expire.setDate(expire.getTime() + (expr_date*24*60*60*1000));

    return "user_id=" + value +
        // "; expires=" + expire.toUTCString() +
        // Need to figure out how to track login expiration
        "; path=/" +
        "; HttpOnly";
}

function get_public(loc) {
    return path.join(__dirname, "..", "public", loc);
}