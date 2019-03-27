const express = require("express");
const path = require("path");
const database = require("./database/database");
const template_file = require("./template_file");
const body_parser = require("body-parser");
const crypto = require("crypto");
const favicon = require("serve-favicon");

// TODO Create admin privileges
// TODO Use as little client-side JS as possible
//      in order to make content accessible
// TODO Use responsive web design
// TODO Make validation in verb_db to ensure
//      that verbs aren't repeated, among other things
// TODO Always validate *all* form submissions
// TODO Make a way to edit the verbs
// TODO Lock DB when saving it
// TODO Figure out how to track login expiration
// TODO Ensure that username and password meet certain
//      requirements
// TODO !! Update user info when they get a verb
//      wrong/right
// TODO Show correct conjugations of conjugations user
//      got wrong
// TODO If verb isn't in verb database, get rid of it
//      from every user's frequently missed
// TODO Finish up CSS design

// Run tests
database.run_tests();
template_file.run_tests();

// Load the databases
let user_db = new database.UserDB(path.join(__dirname, "..", "data", "users.json"));
let verb_db = new database.VerbDB(path.join(__dirname, "..", "data", "verbs.json"));

// The amount of time between saving (in ms)
const save_interval = 60000; // Once per minute

// The amount of time before cookies expire (in days)
const expr_date = 7;

const app = express();
const port = 8080;
app.listen(port, () => console.log("Listening on port 8080..."));

app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: true }));
app.get("/:type(js|css|res)/:file", (req, res) => {
    res.sendFile(get_public(path.join(req.params.type, req.params.file)));
});

app.use(favicon(get_public(path.join("res", "favicon.png"))));

app.use((req, res, next) => {
    if (req.headers.cookie) {
        req.cookies = parse_cookies(req.headers.cookie);
        if (req.cookies.user_id &&
            user_db.is_valid_id(req.cookies.user_id))
            req.user = user_db.username_by_id(req.cookies.user_id);
        else if (req.cookies.user_id &&
            !user_db.is_valid_id(req.cookies.user_id))
            res.setHeader("Set-Cookie", remove_cookie("user_id"));
    }

    next();
});

app.get("/", (req, res) => {
    res.sendFile(get_public("index.html"));
});

app.use("/login|/register", (req, res, next) => {
    if (req.user)
        res.redirect("/dashboard");
    else
        next();
});

app.get("/login", (req, res) => {
    res.sendFile(get_public("login.html"));
});

app.get("/register", (req, res) => {
    res.sendFile(get_public("register.html"));
});

app.post("/login", (req, res) => {
    let { username, password } = req.body;
    let response = user_db.request({ username, password })
        .validate(({ username }, db) => db.has_user(username))
        .validate(({ username, password }, db) => db.match(username, password))
        .modify_db(({ username, password }, db) => db.login(username, password))
        .check_db(({ username }, db) => db.is_logged_in(username))
        .then(({ username }, output, db) => (
            { user_id: db.get_user_id(username) }
        ));

    user_db = response.get_db();

    let cookie = generate_cookie("user_id", response.to_json().user_id);
    res.setHeader("Set-Cookie", cookie);

    res.send(JSON.stringify(response.to_json()));
});

app.post("/register", (req, res) => {
    let { username, password } = req.body;
    let response = user_db.request({ username, password })
        .validate(({ username }) => username !== "")
        .validate(({ username }, db) => !db.has_user(username))
        .modify_db(({ username, password }, db) => {
            let salt = crypto.randomBytes(16).toString("hex");
            return db.add_user(username, password, salt)
                .login(username, password);
        })
        .check_db(({ username }, db) => db.is_logged_in(username))
        .then(({ username }, output, db) => {
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

app.use((req, res, next) => {
    if (req.user)
        next();
    else
        res.redirect("/login");
});

app.get("/dashboard", (req, res) => {
    let file = new template_file.TemplateFile(get_public("dashboard.html"))
        .variable("username", req.user)
        .variable("profile-picture", user_db.get_pic(req.user))
        .list("freq-missed", user_db.get_freq_missed(req.user, 5))
        .list("verbs", verb_db.verb_list());
    res.send(file.toString());
});

app.get("/verbs/manage", (req, res) => {
    let file = new template_file.TemplateFile(get_public("manage-verbs.html"))
        .checklist("verbs", verb_db.verb_list())
        .list("verbs", verb_db.verb_list());
    res.send(file.toString());
});

app.get("/verbs/add", (req, res) => {
    let file = new template_file.TemplateFile(get_public("add-verbs.html"))
        .list("verbs", verb_db.verb_list());
    res.send(file.toString());
});

app.get("/verbs/study/:mode", (req, res) => {
    let mode = req.params.mode;
    let { verb, tense } = req.query;

    if (verb_db.verb_list().length === 0) {
        res.redirect("/verbs/add");
        return;
    }

    switch (mode) {
        case "all": {
            if (verb && tense) {
                if (!verb_db.has(verb, tense)) {
                    res.redirect("/verbs/study/all");
                    break;
                }

                let file = new template_file.TemplateFile(get_public("study-verb.html"))
                    .variable("mode", mode)
                    .variable("verb", verb)
                    .variable("tense", tense)
                    .list("verbs", verb_db.verb_list());
                res.send(file.toString());
                break;
            }

            let { verb: new_verb, tense: new_tense } = verb_db.get_random();
            new_verb = encodeURIComponent(new_verb);
            new_tense = encodeURIComponent(new_tense);
            res.redirect("/verbs/study/all?verb=" + new_verb + "&tense=" + new_tense);
            break;
        }
        default:
            res.redirect("/verbs/study/all");
            break;
    }
});

app.get("/logout", (req, res) => {
    if (req.user)
        user_db = user_db.logout(req.user);

    let cookie = remove_cookie("user_id");
    res.setHeader("Set-Cookie", cookie);

    res.redirect("/login");
});

app.post("/verbs/manage", (req, res) => {
    let { del = false, edit = false, ...verbs } = req.body; // 'del' is delete

    if (del) // Delete?
        for (let verb in verbs)
            verb_db = verb_db.remove_verb(verb);
    else if (edit) { // Edit?
    }

    res.redirect("/verbs/manage");
});

app.post("/verbs/add", (req, res) => {
    let verb = verb_from(req.body);
    verb_db = verb_db.add_verb(verb);
    res.redirect("/verbs/add");
});

app.post("/verbs/study/all", (req, res) => {
    let { method, verb, tense, ...answers } = req.body;
    let correct = check_verb(verb, tense, answers, verb_db);

    if (correct.all_correct)
        user_db = user_db.correct(req.user, verb, tense);
    else
        user_db = user_db.incorrect(req.user, verb, tense);

    let file = new template_file.TemplateFile(get_public("show-results.html"))
        .variable("mode", "all")
        .variable("verb", verb)
        .variable("tense", tense)
        .variable("je-correct", is_correct(correct.je))
        .variable("je-answer", answers.je)
        .variable("tu-correct", is_correct(correct.tu))
        .variable("tu-answer", answers.tu)
        .variable("il-correct", is_correct(correct.il))
        .variable("il-answer", answers.il)
        .variable("nous-correct", is_correct(correct.nous))
        .variable("nous-answer", answers.nous)
        .variable("vous-correct", is_correct(correct.vous))
        .variable("vous-answer", answers.vous)
        .variable("ils-correct", is_correct(correct.ils))
        .variable("ils-answer", answers.ils)
        .list("verbs", verb_db.verb_list());

    res.send(file.toString());
});

app.use((req, res) => {
    res.status(404).sendFile(get_public("404.html"));
});

app.use((error, req, res) => {
    console.log(error);
    res.status(500).sendFile(get_public("500.html"));
});

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
    return name + "=" + value +
        "; path=/" +
        "; HttpOnly";
}

function remove_cookie(name) {
    // Set the expiration date to a date that has passed
    // in order to remove the cookie
    let expire = new Date(Date.now() - 60000);

    return name + "=" + "" +
        "; expires=" + expire.toUTCString() +
        "; path=/" +
        "; HttpOnly";
}

function verb_from(req_body) {
    // Extract the tenses
    let tenses = [];

    for (let val in req_body)
        if (/tense-\d+/.test(val)) { // If the key matches 'tense-#'
            let i = /\d+/.exec(val)[0]; // Get the number
            tenses.push({
                tense: req_body["tense-" + i],
                je: req_body["je-" + i],
                tu: req_body["tu-" + i],
                il: req_body["il-" + i],
                nous: req_body["nous-" + i],
                vous: req_body["vous-" + i],
                ils: req_body["ils-" + i]
            });
        }

    return {
        infinitive: req_body.infinitive,
        tenses
    };
}

function check_verb(verb, tense, answers, verb_db) {
    let conj = verb_db.get_conj(verb, tense);
    let correct = {};

    for (let pronoun in conj)
        correct.all_correct &= correct[pronoun] = answers[pronoun] === conj[pronoun];

    return correct;
}

function is_correct(correct) {
    return (correct) ? "correct" : "incorrect";
}

function get_public(loc) {
    return path.join(__dirname, "..", "public", loc);
}