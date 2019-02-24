const fs = require("fs-extra");
const crypto = require("crypto");
const db_req = require("./db_request");

class UserDB {
    constructor(location) {
        this.location = location;
        this.logged_in = [];
        this.modified = false;

        try {
            this.users = fs.readJSONSync(location);
        } catch(error) {
            this.users = [];
        }
    }

    has_user(username) {
        return this.users
            .some((user) => user.username === username);
    }

    match(username, password) {
        return this.users.filter((user) => user.username === username)
            .some((user) =>
                user.password_hash === hash_password(password, user.salt));
    }

    add_user(username, password, salt) {
        this.modified = true;

        this.users.push({
            username: username,
            password_hash: hash_password(password, salt),
            salt: salt,
            verb_practice: [],
            custom_sets: []
        });

        return this;
    }

    is_logged_in(username) {
        return this.logged_in.some((user) => user.username === username);
    }

    login(username, password) {
        this.modified = true;

        if(this.match(username, password) && !this.is_logged_in(username)) {
            let user_id;
            do
                user_id = crypto.randomBytes(16).toString("hex");
            while(this.logged_in.some((user) => user.user_id === user_id));
            this.logged_in.push({
                username: username,
                user_id: user_id
            });
        }

        return this;
    }

    get_user_id(username) {
        let user = this.logged_in.find((user) => user.username === username);
        if(user) return user.user_id;
        else return undefined;
    }

    logout(username) {
        this.modified = true;

        this.logged_in = this.logged_in.filter((user) => user.username !== username);
        return this;
    }

    save() {
        if(this.modified) {
            fs.writeJSONSync(this.location, this.users);
            this.modified = false;
        }
    }

    request(input) {
        return new db_req.DBRequest(input, this);
    }
}

function hash_password(password, salt) {
    let hashed_password = crypto.createHash("md5");
    hashed_password.update(salt + "" + password);

    return hashed_password.digest("hex");
}

function generate_salt() {
    return crypto.randomBytes(16).toString("hex");
}

function run_tests() {
    const test = require("../test/test");
    const path = require("path");
    const os = require("os");

    db_req.run_tests();

    const Test = test.Test;
    const TestSuite = test.TestSuite;
    const assert = test.assert;
    const assert_eq = test.assert_eq;
    const assert_neq = test.assert_neq;

    let temp_dir = fs.mkdtempSync(path.join(os.tmpdir(), "db-"));

    // Write the normal database
    let normal_loc = path.join(temp_dir, "normal.json");
    let hashed_password = crypto.createHash("md5");
    hashed_password.write("abc123" + "p@$$w0rd");
    hashed_password.end();
    fs.writeFileSync(normal_loc,
        JSON.stringify([{
            username: "user_1",
            password_hash: hashed_password.read().toString("hex"),
            salt: "abc123",
            verb_practice: [],
            custom_sets: []
        }]));

    let suite = TestSuite.builder()
    .name("Database Tests")

    .description("Test that each database works")

    .add_test(Test.builder()
        .name("Has User Test")
        
        .description(
            "Test that the database knows " +
            "if it has a user")
        
        .test(() => {
            let normal = new UserDB(normal_loc);
            
            assert(normal.has_user("user_1"), "Database does not have 'user_1'");
            assert(!normal.has_user("user_2"), "Database has 'user_2'");
        }))
    
    .add_test(Test.builder()
        .name("Match User to Passwd Test")
        
        .description(
            "Test that the database can " +
            "match username to password"
        )
        
        .test(() => {
            let normal = new UserDB(normal_loc);
            
            assert(normal.match("user_1", "p@$$w0rd"), "Password did not match username");
            assert(!normal.match("user_1", "password"), "Password matched username");
        }))
    
    .add_test(Test.builder()
        .name("Create User Test")
        
        .description(
            "Ensure that the database can " +
            "add a user"
        )
        
        .test(() => {
            let normal = new UserDB(normal_loc);
            
            assert(!normal.has_user("james_doe"), "User DB shouldn't have 'james_doe'");
            
            normal = normal.add_user("james_doe", "mynameisjames");
            
            assert(normal.match("james_doe", "mynameisjames"), "User DB does not have correct info");
        }))
    
    .add_test(Test.builder()
        .name("Login Test")
        
        .description(
            "Ensure that the login system " +
            "works correctly"
        )
        
        .test(() => {
            let normal = new UserDB(normal_loc);
            
            assert(!normal.is_logged_in("user_1"), "User 1 should not be logged in");

            normal = normal.login("user_1", "p@$$w0rd");

            assert(normal.is_logged_in("user_1"));
            assert_neq(normal.get_user_id("user_1"), undefined);

            normal = normal.logout("user_1");

            assert(!normal.is_logged_in("user_1"));
            assert_eq(normal.get_user_id("user_1"), undefined);
        }))
    
    .build();
    
    TestSuite.run(suite).print_result();

    fs.removeSync(temp_dir);

}

try {
    module.exports.run_tests = exports.run_tests = run_tests;
    module.UserDB = exports.UserDB = UserDB;
    module.generate_salt = exports.generate_salt = generate_salt;
} catch(error) {}