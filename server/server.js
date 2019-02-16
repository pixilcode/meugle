const express = require("express");
const path = require("path");
const database = require("./database/database");
const body_parser = require("body-parser");

// Run tests
database.run_tests();

// Load the database
let user_db = new database.UserDB(path.join(__dirname, "..", "data", "users.json"));

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
    let response;
    if(!user_db.has_user(username))
        response = {
            invalid_input: true,
            server_error: false,
            user_id: undefined,
        }
    else {
        user_db = user_db
            .login(username, password)
            .save();
        if(!user_db.match(username, password)) {
            response = {
                invalid_input: true,
                server_error: false,
                user_id: undefined,
            }
        } else if(!user_db.is_logged_in(username)) {
            response = {
                invalid_input: false,
                server_error: true,
                user_id: undefined,
            }
        } else {
            let user_id = user_db.get_user_id(username);
            response = {
                invalid_input: false,
                server_error: false,
                user_id: user_id,
            }
        }
        
    }

    res.send(JSON.stringify(response));
});

app.post("/register", (req, res) => {
    let { username, password } = req.body;
    let response;
    if(user_db.has_user(username)) {
        response = {
            user_taken: true,
            server_error: false,
            user_id: undefined,
        };
    } else {
        let salt = crypto.randomBytes(16).toString('hex');
        user_db = user_db
            .add_user(username, password, salt)
            .login(username, password);

        user_db.save();

        if(!user_db.is_logged_in(data))
            response = {
                user_taken: true,
                server_error: true,
                user_id: undefined
            }
        else {
            let user_id = user_db.get_user_id(username);
            response = {
                user_taken: false,
                server_error: false,
                user_id: user_id
            }
        }
    }

    res.send(JSON.stringify(response));
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
    return path.join(__dirname, "..", "public", loc);
}