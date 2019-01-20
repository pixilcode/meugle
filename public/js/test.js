const Test = {
    builder: () => {
        let name = "";
        let test_method = () => {};
        let ignore = false;

        let test_builder = {
            name: (test_name) => {
                name = test_name;
                return test_builder;
            },

            description: (description) => {
                return test_builder;
            },

            ignore: () => {
                ignore = true;
                return test_builder;
            },

            test: (method) => {
                test_method = method;
                return test_builder;
            },

            build: () => {
                return {
                    name: name,
                    ignore: ignore,
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
        let show_ignored = false;
        let tests = [];

        let suite_builder = {
            name: (suite_name) => {
                name = suite_name;
                return suite_builder;
            },

            description: (description) => {
                return suite_builder;
            },

            show_ignored: (show) => {
                show_ignored = show;
                return suite_builder;
            },

            add_test: (test) => {
                tests.push(test.build());
                return suite_builder;
            },

            build: () => {
                return {
                    name: name,
                    show_ignored: show_ignored,
                    tests: tests
                }
            }
        };

        return suite_builder;
    },

    run: (test_suite) => {
        let ignored = test_suite.tests.filter((test) => test.ignore);
        let results = test_suite.tests.filter((test) => !test.ignore).map((test) => Test.run(test));
        let is_success = false;

        if(results.every((result) => result.is_success))
            is_success = true;
        
        let tests_run = results.length;
        let tests_failed = results.filter((result) => !result.is_success).length;

        let summary = tests_run + " run, " + tests_failed + " failed";
        if(test_suite.name !== "")
            summary = "[" + test_suite.name + "] " + summary;
        if(ignored.length > 0) {
            summary += ", " + ignored.length + " ignored";
        }

        let message = tests_run + " run, " + tests_failed + " failed";
        if(ignored.length > 0) {
            message += ", " + ignored.length + " ignored";
        }

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
            message = failures.reduce((message, result) =>
                    message + "\n\t\t" + result.result_message,
                message);
        }

        if(ignored.length > 0 && test_suite.show_ignored) {
            message += "\n\tIgnored";
            message = ignored.reduce((message, test) =>
                    message + "\n\t\t" + "[" + test.name + "] Ignored",
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

// Tests
function run_tests() {
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

            assert_neq(undefined, success.name, "Missing name");
            assert_eq("Success Test", success.name, "Incorrect name: " + success.name);

            let result = Test.run(success);

            assert(result.is_success);
            assert_eq("[Success Test] Success!", result.result_message);
        }))


    .add_test(Test.builder()
        .name("Failing Test")

        .description(
            "Test that the testing framework acts correctly " +
            "when a test is unsuccessful")

        .test(() => {
            let fail = Test.builder()
            .name("Fail Test")
            .test(() => assert(false))
            .build();

            let result = Test.run(fail);

            assert(!result.is_success);
            assert_eq("[Fail Test] Assertion failed", result.result_message);
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
                .test(() => assert(false)))
            .build();

            let result = TestSuite.run(suite);

            assert(!result.is_success);
            assert_eq("[Test Test Suite] 2 run, 1 failed", result.summary);
            assert_eq(
                "[Test Test Suite] 2 run, 1 failed" +
                "\n\tSuccesses" +
                "\n\t\t[Success Test] Success!" +
                "\n\tFailures" +
                "\n\t\t[Fail Test] Assertion failed",
                result.result_message
            );
        }))


    .add_test(Test.builder()
        .name("Ignoring Tests Test")

        .description(
            "Tests to ensure that tests are ignored")

        .test(() => {
            let suite = TestSuite.builder()
            .add_test(Test.builder()
                .name("Ignored Test")
                .ignore()
                .test(() => {}));
            
            let result = TestSuite.run(suite.build());

                assert_eq("0 run, 0 failed, 1 ignored", result.summary);
                assert_eq(
                    "0 run, 0 failed, 1 ignored",
                    result.result_message
                )
            
            result = TestSuite.run(suite.show_ignored(true).build());

            assert_eq("0 run, 0 failed, 1 ignored", result.summary);
            assert_eq(
                "0 run, 0 failed, 1 ignored" +
                "\n\tIgnored" +
                "\n\t\t[Ignored Test] Ignored",
                result.result_message
            )
        }))
    .build();

    TestSuite.run(suite).print_result();
}

// Try to export the module
try {
    module.exports.Test = exports.Test = Test;
    module.exports.TestSuite = exports.TestSuite = TestSuite;
    module.exports.assert = exports.assert = assert;
    module.exports.assert_eq = exports.assert_eq = assert_eq;
    module.exports.assert_neq = exports.assert_neq = assert_neq;
    module.exports.run_tests = exports.run_tests = run_tests;
} catch(error) {}