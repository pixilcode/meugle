const Test = {
    builder: () => {
        let name = "";
        let test_method = () => {};

        let test_builder = {
            name: (test_name) => {
                name = test_name;
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
            return single_test_result(true, test.name, "Success!");
        } catch(error) {
            return single_test_result(false, test.name, error);
        }
    },

    assert: (statement, message = "") => {
        if(statement === false)
            if(message === "")
                throw "Assertion failed";
            else
                throw "Assertion failed: " + message;
    },

    assert_eq: (expected, actual, message = "") => {
        if(expected !== actual)
            if(message === "")
                throw "Assertion failed: '" + expected + "' != '" + actual + "'";
            else
                throw "Assertion failed: " + message;
    },

    assert_neq: (expected, actual, message = "") => {
        if(expected === actual)
            if(message === "")
                throw "Assertion failed: '" + expected + "' == '" + actual + "'";
            else
                throw "Assertion failed: " + message;
    }
};

// Build a single test result object
function single_test_result(is_success, test_name, message) {
    let summary = test_name + ": 1 run, " + ((is_success) ? 0 : 1) + " failed";
    let result_message = "[" + test_name + "] " + message;
    return {
        test_name: test_name,
        is_success: is_success,
        result_message: result_message,
        print_result: () => console.log(result_message)
    }
}

// Try to export the module
try {
    module.exports = exports = Test;
} catch(error) {}

// Tests
let successful_test = Test.builder()
.name("Successful Test")
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
}).build();
Test.run(successful_test).print_result();

let failing_test = Test.builder()
.name("Failing Test")
.test(() => {
    let fail = Test.builder()
    .name("Fail Test")
    .test(() => Test.assert(false))
    .build();

    let result = Test.run(fail);

    Test.assert(!result.is_success);
    Test.assert_eq("[Fail Test] Assertion failed", result.result_message);
}).build();
Test.run(failing_test).print_result();