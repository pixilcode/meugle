class Test {
    static builder() {
        return new TestBuilder();
    }

    static run(test) {
        try {
            test.test_method();
            return new Result(true, test.name, "Success!", test.name + ": 1 run, 0 failed");
        } catch(error) {
            return new Result(false, test.name, error, test.name + ": 1 run, 1 failed");
        }
    }

    constructor(name, ignore, test_method) {
        this.name = name;
        this.ignore = ignore;
        this.test_method = test_method;
    }
}

class TestBuilder {
    constructor() {
        this.test_name = "";
        this.test_method = () => {};
        this.ignore_test = false;
    }

    name(test_name) {
        this.test_name = test_name;
        return this;
    }

    description(description) {
        return this;
    }

    ignore() {
        this.ignore_test = true;
        return this;
    }

    test(method) {
        this.test_method = method;
        return this;
    }

    build() {
        return new Test(this.test_name, this.ignore_test, this.test_method);
    }
}

class TestSuite {
    static builder() {
        return new TestSuiteBuilder();
    }

    static run(test_suite) {
        let ignored = test_suite.tests.filter(test => test.ignore);
        let results = test_suite.tests.filter(test => !test.ignore).map(test => Test.run(test));
        let is_success = false;

        if(results.every(result => result.is_success))
            is_success = true;
        
        let tests_run = results.length;
        let tests_failed = results.filter(result => !result.is_success).length;

        let summary = tests_run + " run, " + tests_failed + " failed";
        if(test_suite.name !== "")
            summary = "[" + test_suite.name + "] " + summary;
        if(ignored.length > 0)
            summary += ", " + ignored.length + " ignored";

        let message = tests_run + " run, " + tests_failed + " failed";
        if(ignored.length > 0)
            message += ", " + ignored.length + " ignored";

        let successes = results.filter(result => result.is_success);
        let failures = results.filter(result => !result.is_success);

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

        return new Result(is_success, test_suite.name, message, summary);
    }

    constructor(name, show_ignored, tests) {
        this.name = name;
        this.show_ignored = show_ignored;
        this.tests = tests;
    }
}

class TestSuiteBuilder {
    constructor() {
        this.suite_name = "";
        this.show_ignored_tests = false;
        this.tests = [];
    }

    name(suite_name) {
        this.suite_name = suite_name;
        return this;
    }

    description(description) {
        return this;
    }

    show_ignored(show) {
        this.show_ignored_tests = show;
        return this;
    }

    add_test(test) {
        this.tests.push(test.build());
        return this;
    }

    build() {
        return new TestSuite(this.suite_name, this.show_ignored_tests, this.tests);
    }
}

class Result {
    constructor(is_success, test_name, message, summary) {
        let result_message = message;
        if(test_name !== "")
            result_message = "[" + test_name + "] " + message;
        
        this.test_name = test_name;
        this.is_success = is_success;
        this.result_message = result_message;
        this.summary = summary;
    }

    print_result() {
        console.log(this.result_message + "\n");
    }
}

function assert(statement, message = "") {
    if(!statement)
        if(message === "")
            throw "Assertion failed";
        else
            throw "Assertion failed: " + message;
}

function assert_eq(expected, actual, message = "") {
    if(typeof expected === "object" || typeof actual === "object")
        for(let i in expected)
            assert_eq(expected[i], actual[i], message);
    else if(expected !== actual)
        if(message === "")
            throw "Assertion failed: '" + expected + "' != '" + actual + "'";
        else
            throw "Assertion failed: " + message;
}

function assert_neq(expected, actual, message = "") {
    if(typeof expected === "object" || typeof actual === "object")
        for(let i in expected)
            assert_eq(expected[i], actual[i], message);
    else if(expected === actual)
        if(message === "")
            throw "Assertion failed: '" + expected + "' == '" + actual + "'";
        else
            throw "Assertion failed: " + message;
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