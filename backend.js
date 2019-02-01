function validate(username, password, database) {
    let success = database.has_user(username) && database.match(username, password);
    let session_id = "";
    // if(success) session_id = database.generate_session_id(username); // Needs testing
    return {
        succesful: success,
        session_id: session_id
    };
}

function run_tests() {
    const test = require("./test");

    let Test = test.Test;
    let TestSuite = test.TestSuite;
    let assert = test.assert;

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

            assert(result.succesful, "'john_doe' or 'p@$$w0rd' was not successful");

            password = "n0tp@$$w0rd";

            result = validate(username, password, server);

            assert(!result.succesful, "Incorrect username and password was successful");

            username = "not_in_server";
            password = "p@$$w0rd";

            result = validate(username, password, server);

            assert(!result.succesful, "Given username or password doesn't exist");
        }))
    
    .build();

    TestSuite.run(suite).print_result();

    function get_mock_server() {
        let server = {
            has_user: (username) => {
                return username === "john_doe";
            },

            match: (username, password) => {
                return username === "john_doe"
                    && password === "p@$$w0rd";
            },

            generate_session_id: () => {
                return "session id";
            }
        };

        return server;
    }
}

try {
    module.exports.run_tests = exports.run_tests = run_tests;
    module.exports.validate = exports.validate = validate;
} catch(error) {}