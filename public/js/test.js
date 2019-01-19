const Test = {
    builder: () => {
        let was_run = false;
        let test_method = () => {};

        let test_builder = {
            test: (method) => {
                test_method = method;
                return test_struct;
            },

            build: () => {
                return {
                    was_run: was_run,
                    test_method:test_method
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

let test = Test.builder()
.test(() => {
    Test.assert(true);
}).build();
console.log(test.was_run);
let result = Test.run(test);
console.log(test.was_run);