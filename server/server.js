const express = require("express");
const path = require("path");
const database = require("./database/database");
const template_file = require("./template_file");
const body_parser = require("body-parser");
const crypto = require("crypto");

// TODO Create admin privileges
// TODO Use as little client-side JS as possible
//      in order to make content accessible
// TODO Use responsive web design
// TODO Make validation in verb_db to ensure
//      that verbs aren't repeated, among other things
// TODO Always validate *all* form submissions
// TODO Make a way to edit the verbs

// Run tests
database.run_tests();
template_file.run_tests();

// Load the databases
let user_db = new database.UserDB(path.join(__dirname, "..", "data", "users.json"));
let verb_db = new database.VerbDB(path.join(__dirname, "..", "data", "verbs.json"));

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
app.get("/:type(js|css|res)/:file", (req, res) => {
    res.sendFile(get_public(req.params.type + "/" + req.params.file));
});

app.get("/", (req, res) => {
    res.sendFile(get_public("index.html"));
});

app.get("/login|/register", (req, res, next) => {
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
});

app.get("/dashboard|/verbs/.+", (req, res, next) => {
    if(req.headers.cookie) {
        let cookies = parse_cookies(req.headers.cookie);
        if(cookies.user_id &&
            user_db.is_valid_id(cookies.user_id)) {
            req.user_id = cookies.user_id;
            next();
        } else
            res.redirect("/login");
    } else
        res.redirect("/login");
});

app.get("/dashboard", (req, res) => {
    // TODO Do some work here to fix the page and personalize it
    let username = user_db.username_by_id(req.user_id);
    let file = new template_file.TemplateFile(get_public("dashboard.html"))
        .variable("username", username)
        .variable("profile-picture", user_db.get_pic(username))
        .list("freq-missed", user_db.get_freq_missed(username, 5))
        .list("verbs", verb_db.verb_list());
    res.send(file.toString());
});

app.get("/verbs/manage", (req, res) => {
    let file = new template_file.TemplateFile(get_public("manage-verbs.html"))
        .checklist("verbs", verb_db.verb_list());
    res.send(file.toString());
});

app.get("/verbs/add", (req, res) => {
    let file = new template_file.TemplateFile(get_public("add-verbs.html"));
    res.send(file.toString());
});

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
    // TODO Ensure that the username meets certain requirements
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

app.post("/verbs/manage", (req, res) => {
    let { del=false, edit=false, ...verbs } = req.body; // 'del' is delete

    if(del) // Delete?
        for(let verb in verbs)
            verb_db = verb_db.remove_verb(verb);
    else if(edit) { // Edit?
        // TODO Make a way to edit the verbs
    }

    res.redirect("/verbs/manage");
});

app.post("/verbs/add", (req, res) => {
    let verb = verb_from(req.body);
    verb_db = verb_db.add_verb(verb);
    res.redirect("/verbs/add");
});

app.use((req, res) => {
    res.status(404).sendFile(get_public("404.html"));
});

app.use((error, req, res, next) => {
    console.log(error);
    res.status(500).sendFile(get_public("500.html"));
});

// TODO Need to lock db when saving
setInterval(() => {
    user_db.save();
    verb_db.save();
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

function verb_from(req_body) {
    // Extract the tenses
    let tenses = [];
    
    for(let val in req_body)
        if(/tense-\d+/.test(val)) { // If the key matches 'tense-#'
            let i = /\d+/.exec(val)[0]; // Get the number
            tenses.push({
                tense: req_body["tense-"+i],
                je: req_body["je-"+i],
                tu: req_body["tu-"+i],
                il: req_body["il-"+i],
                nous: req_body["nous-"+i],
                vous: req_body["vous-"+i],
                ils: req_body["ils-"+i]
            });
        }
    
    return {
        infinitive: req_body.infinitive,
        tenses
    };
}

function get_public(loc) {
    return path.join(__dirname, "..", "public", loc);
}