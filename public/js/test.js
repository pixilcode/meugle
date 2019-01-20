const Test = {
    builder: () => {
        let name = "";
        let test_method = () => {};

        let test_builder = {
            name: (test_name) => {
                name = test_name;
                return test_builder;
            },

            description: (description) => {
                return test_builder;
            },

            test: (method) => {
                test_method = method;
                return test_builder;
            },

            build: () => {
                return {
                    name: name,
                    test_method: test_method
                };
            }
        };

        return test_builder;
    },

    run: (test) => {
        try {
            test.test_method();
            return test_result(true, test.name, "Success!", test.name + ": 1 run, 0 failed");
        } catch(error) {
            return test_result(false, test.name, error, test.name + ": 1 run, 1 failed");
        }
    }
};

const TestSuite = {
    builder: () => {
        let name = "";
        let test_methods = [];

        let suite_builder = {
            name: (suite_name) => {
                name = suite_name;
                return suite_builder;
            },

            description: (description) => {
                return suite_builder;
            },

            add_test: (test) => {
                test_methods.push(test.build());
                return suite_builder;
            },

            build: () => {
                return {
                    name: name,
                    test_methods: test_methods
                }
            }
        };

        return suite_builder;
    },

    run: (test_suite) => {
        let results = test_suite.test_methods.map((test) => Test.run(test));
        let is_success = false;

        if(results.every((result) => result.is_success))
            is_success = true;
        
        let tests_run = results.length;
        let tests_failed = results.filter((result) => !result.is_success).length;

        let summary = "[" + test_suite.name + "] " + tests_run + " run, " + tests_failed + " failed";
        
        let message = tests_run + " run, " + tests_failed + " failed";

        let successes = results.filter((result) => result.is_success);
        let failures = results.filter((result) => !result.is_success);

        if(successes.length > 0) {
            message += "\n\tSuccesses";
            message = successes.reduce((message, result) =>
                    message + "\n\t\t" + result.result_message,
                message);
        }
        
        if(failures.length > 0) {
            message += "\n\tFailures";
            message = failures.reduce((aggregate, result) =>
                    message + "\n\t\t" + result.result_message,
                message);
        }

        return test_result(is_success, test_suite.name, message, summary)
    }
}

function assert(statement, message = "") {
    if(statement === false)
        if(message === "")
            throw "Assertion failed";
        else
            throw "Assertion failed: " + message;
}

function assert_eq(expected, actual, message = "") {
    if(expected !== actual)
        if(message === "")
            throw "Assertion failed: '" + expected + "' != '" + actual + "'";
        else
            throw "Assertion failed: " + message;
}

function assert_neq(expected, actual, message = "") {
    if(expected === actual)
        if(message === "")
            throw "Assertion failed: '" + expected + "' == '" + actual + "'";
        else
            throw "Assertion failed: " + message;
}

// Build a single test result object
function test_result(is_success, test_name, message, summary) {
    let result_message = message;
    if(test_name !== "")
        result_message = "[" + test_name + "] " + message;
    
    return {
        test_name: test_name,
        is_success: is_success,
        result_message: result_message,
        summary: summary,
        print_result: () => console.log(result_message)
    }
}

// Try to export the module
try {
    module.exports.Test = exports.Test = Test;
    module.exports.TestSuite = exports.TestSuite = TestSuite;
    module.exports.assert = exports.assert = assert;
    module.exports.assert_eq = exports.assert_eq = assert_eq;
    module.exports.assert_neq = exports.assert_neq = assert_neq;
} catch(error) {}

// Tests
let suite = TestSuite.builder()
.name("Testing Framework Tests")
.description("Test each element of the testing framework")
.add_test(Test.builder()
    .name("Successful Test")
    .description(
        "Test that the testing framework acts correctly " +
        "when a test is successful")
    .test(() => {
        let success = Test.builder()
        .name("Success Test")
        .test(() => {})
        .build();

        Test.assert_neq(undefined, success.name, "Missing name");
        Test.assert_eq("Success Test", success.name, "Incorrect name: " + success.name);

        let result = Test.run(success);

        Test.assert(result.is_success);
        Test.assert_eq("[Success Test] Success!", result.result_message);
    }))
.add_test(Test.builder()
    .name("Failing Test")
    .description(
        "Test that the testing framework acts correctly " +
        "when a test is unsuccessful")
    .test(() => {
        let fail = Test.builder()
        .name("Fail Test")
        .test(() => Test.assert(false))
        .build();

        let result = Test.run(fail);

        Test.assert(!result.is_success);
        Test.assert_eq("[Fail Test] Assertion failed", result.result_message);
    }))
.add_test(Test.builder()
    .name("Test Suite Test")
    .description(
        "Test that the test suite works correctly")
    .test(() => {
        let suite = TestSuite.builder()
        .name("Test Test Suite")
        .add_test(Test.builder()
            .name("Success Test")
            .test(() => {}))
        .add_test(Test.builder()
            .name("Fail Test")
            .test(() => Test.assert(false)))
        .build();

        let result = TestSuite.run(suite);

        Test.assert(!result.is_success);
        Test.assert_eq("[Test Test Suite] 2 run, 1 failed", result.summary);
        Test.assert_eq(
            "[Test Test Suite] 2 run, 1 failed" +
            "\n\tSuccesses" +
            "\n\t\t[Success Test] Success!" +
            "\n\tFailures" +
            "\n\t\t[Fail Test] Assertion failed",
            result.result_message
        )
    }))
.build();
TestSuite.run(suite).print_result();