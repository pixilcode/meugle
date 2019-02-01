const fs = require("fs-extra");
const crypto = require("crypto");

function user_db(loc) {
    let users = fs.readJSONSync(loc);
    let logged_in = [];

    let db = {
        has_user: (username) => {
            return users
                .filter((user) => user.username === username).length > 0;
        },
        match: (username, password) => {
            return users.filter((user) => user.username === username)
                .filter((user) => {
                    let hashed_password = crypto.createHash("md5");
                    hashed_password.update(user.salt + "" + password);;

                    hashed_password = hashed_password.digest("hex");

                    return user.password === hashed_password;
                }).length > 0;
        },
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

    return db;
}

function run_tests() {
    const test = require("./test");
    const path = require("path");
    const os = require("os");

    let Test = test.Test;
    let TestSuite = test.TestSuite;
    let assert = test.assert;

    let temp_dir = fs.mkdtempSync(path.join(os.tmpdir(), "db-"));

    // Write the normal database
    let normal_loc = path.join(temp_dir, "normal.json");
    let hashed_password = crypto.createHash("md5");
    hashed_password.write("abc123" + "p@$$w0rd");
    hashed_password.end();
    fs.writeFileSync(normal_loc,
        JSON.stringify([{
            username: "user_1",
            password: hashed_password.read().toString("hex"),
            salt: "abc123",
            verb_practice: [],
            custom_sets: []
        }]));

    let suite = TestSuite.builder()
    .name("Database Tests")

    .description("Test that each database works")

    .add_test(Test.builder()
        .name("File DB Has User Test")
        
        .description(
            "Test that the database knows " +
            "if it has a user")
        
        .test(() => {
            let normal = user_db(normal_loc);
            assert(normal.has_user("user_1"), "Database does not have 'user_1'");
            assert(!normal.has_user("user_2"), "Database has 'user_2'");
        }))
    
    .add_test(Test.builder()
        .name("File DB Match User to Passwd Test")
        
        .description(
            "Test that the database can " +
            "match username to password"
        )
        
        .test(() => {
            let normal = user_db(normal_loc);
            assert(normal.match("user_1", "p@$$w0rd"), "Password did not match username");
            assert(!normal.match("user_1", "password"), "Password matched username");
        }))
    .build();
    
    TestSuite.run(suite).print_result();

    fs.removeSync(temp_dir);

}

try {
    module.exports.run_tests = exports.run_tests = run_tests;
    module.user_db = exports.user_db = user_db;
} catch(error) {}