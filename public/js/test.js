const Test = {
    builder: () => {
        let was_run = false;
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
                    was_run: was_run,
                    //name: name,
                    test_method: test_method
                };
            }
        };

        return test_builder;
    },

    run: (test) => {
        test.test_method();
        test.was_run = true;
        return test;
    },

    assert: (statement, message = "") => {
        if(!statement)
            if(message === "")
                throw "Assertion failed";
            else
                throw "Assertion failed: " + message;
    }
};

var successful_test = Test.builder()
.name("Successful Test")
.test(() => {
    let success = Test.builder()
    .name("Successful Test")
    .test(() => {})
    .build();
    Test.assert(success.name === "Successful Test", "Incorrect/missing name");
    Test.assert(!success.was_run);
    let result = Test.run(success);
    Test.assert(result.was_run);
}).build();

Test.run(successful_test);