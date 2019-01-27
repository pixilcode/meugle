function validate(username, password, server) {
    return {
        user_exists: server.has_user(username),
        succesful: server.has_user(username) && server.match(username, password)
    };
}

function run_tests() {
    const test = require("./test");
    const crypto = require("crypto");

    let Test = test.Test;
    let TestSuite = test.TestSuite;
    let assert = test.assert;
    let assert_eq = test.assert_eq;
    let assert_neq = test.assert_neq;

    let suite = TestSuite.builder()
    .name("Backend Tests")

    .description(
        "Test that backend functions, " +
        "such as validation, work")
    
    .add_test(Test.builder()
        .name("Validation Test")
        
        .description(
            "Ensure that, given the username, password, " +
            "and server, validation works correctly")
        
        .test(() => {
            let username = "john_doe";
            let password = "p@$$w0rd";
            let server = get_mock_server();

            let result = validate(username, password, server);

            assert(result.user_exists, "'john_doe' does not exist");
            assert(result.succesful, "'p@$$w0rd' was not successful");

            password = "n0tp@$$w0rd";

            result = validate(username, password, server);

            assert(result.user_exists, "'john_doe' does not exist");
            assert(!result.succesful, "Incorrect password was successful");

            username = "not_in_server";
            password = "p@$$w0rd";

            result = validate(username, password, server);

            assert(!result.user_exists, "'not_in_server' exists on the server");
            assert(!result.succesful, "Given username doesn't exist");
        }))
    
    .build();

    TestSuite.run(suite).print_result();

    function get_mock_server() {
        
        let hash = crypto.createHash("md5");
        hash.write("p@$$w0rd");
        hash.end();
        let password_hash = hash.read().toString("hex");

        let server = {
            has_user: (username) => {
                return username === "john_doe";
            },

            match: (username, password) => {
                return username === "john_doe"
                    && password === "p@$$w0rd";
            },

            data: [{
                username: "john_doe",
                password: password_hash,
                salt: "s@1ty s@1t",
                verb_practice: [],
                custom_sets: []
            }]
        };

        return server;
    }
}

try {
    module.exports.run_tests = exports.run_tests = run_tests;
} catch(error) {}

run_tests();