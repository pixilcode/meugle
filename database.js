const fs = require("fs-extra");
const crypto = require("crypto");

class UserDB {
    constructor(location) {
        this.location = location;
        this.users = fs.readJSONSync(location);
        this.logged_in = [];
    }

    has_user(username) {
        return this.users
            .filter((user) => user.username === username).length > 0;
    }

    match(username, password) {
        return this.users.filter((user) => user.username === username)
            .filter((user) =>
                user.password_hash === hash_password(password, user.salt))
            .length > 0;
    }

    add_user(username, password, salt) {
        this.users.push({
            username: username,
            password_hash: hash_password(password, salt),
            salt: salt,
            verb_practice: [],
            custom_sets: []
        });

        return this;
    }

    save() {
        fs.writeFileSync(location);
    }
}

function user_db(loc) {
    const users = fs.readJSONSync(loc);
    const logged_in = [];

    {
        // generate_session_id: (username) => {
        //     let id = logged_in
        //         .filter((user) => user.username === username)
        //         .map((user) => user.session_id).pop();
            
        //     if(id) return id;
        //     else {
        //         do {
        //             let hash = crypto.createHash("sha256");
        //             hash.update(Math.random().toString());

        //             id = hash.digest("hex");
        //         } while(logged_in
        //             .filter((user) => user.session_id === id)
        //             .length > 0);
        //         logged_in.push({username: username, session_id: id});
        //         return id;
        //     }
        // }
    };

    throw "'user_db' is deprecated";
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
    const test = require("./test");
    const path = require("path");
    const os = require("os");

    let Test = test.Test;
    let TestSuite = test.TestSuite;
    let assert = test.assert;
    let assert_eq = test.assert_eq;

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
            normal = normal.add_user("james_doe", "mynameisjames");
            assert(normal.match("james_doe", "mynameisjames"));
        }))
    
    .build();
    
    TestSuite.run(suite).print_result();

    fs.removeSync(temp_dir);

}

try {
    module.exports.run_tests = exports.run_tests = run_tests;
    module.UserDB = exports.UserDB = UserDB;
    module.user_db = exports.user_db = user_db;
    module.generate_salt = exports.generate_salt = generate_salt;
} catch(error) {}