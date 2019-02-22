class DBRequest {
    constructor(input_data, database) {
        this.input_data = input_data;
        this.database = database;

        this.invalid_input = false;
        this.db_error = false;
        this.output_data = {};

        this.log = [];
    }

    validate(validation) {
        if(!this.db_error && !this.invalid_input)
            try {
                // If validation is successful, input is not invalid
                let result = !validation(this.input_data, this.database);
                this.invalid_input = result;
                this.log.push("Invalid: " + result);
            } catch(error) {
                this.db_error = true;
                this.log.push("Error: " + error);
            }

        return this;
    }

    check_db(check) {
        if(!this.db_error && !this.invalid_input)
            try {
                // If check is successful, there is no error
                let result = !check(this.input_data, this.database);
                this.db_error = result;
                this.log.push("DB Error: " + result);
            } catch(error) {
                this.db_error = true;
                this.log.push("Error: " + error);
            }

        return this;
    }

    modify_db(modify) {
        if(!this.db_error && !this.invalid_input)
            try {
                this.database = modify(this.input_data, this.database);
                this.log.push("Modified DB");
            } catch(error) {
                this.db_error = true;
                this.log.push("Error: " + error);
            }
        
        return this;
    }

    then(fn) {
        if(!this.db_error && !this.invalid_input)
            try {
                this.output_data = fn(this.input_data, this.output_data, this.database);
                this.log.push("Transformed Data");
            } catch(error) {
                this.db_error = true;
                this.log.push("Error: " + error);
            }

        return this;
    }

    to_json() {
        if(this.db_error || this.invalid_input)
            return {
                invalid_input: this.invalid_input,
                server_error: this.db_error
            }
        else
            return {
                invalid_input: this.invalid_input,
                server_error: this.db_error,
                ...this.output_data
            }
    }

    get_db() {
        return this.database;
    }

    get_log() {
        return this.log;
    }
}

function run_tests() {
    const test = require("../test/test");

    class MockDB {
        constructor() {
            this.name = "mock";
            this.modified = false;
        }

        modify() {
            this.modified = true;
            return this;
        }
    }

    const Test = test.Test;
    const TestSuite = test.TestSuite;
    const assert = test.assert;
    const assert_eq = test.assert_eq;
    const assert_neq = test.assert_neq;

    let username = "john_doe";
    let password = "p@$$w0rd";

    let suite = TestSuite.builder()
    .name("Database Request Tests")
    
    .description("Test that requests work")

    .add_test(Test.builder()
        .name("Test Init")
        
        .description(
            "Ensure that validation requests can " +
            "correctly be initiated")
        
        .test(() => {
            let user_db = new MockDB();

            let request = new DBRequest({username, password}, user_db);

            let req_json = request.to_json();
            assert(!req_json.invalid_input);
            assert(!req_json.server_error);
        }))
    
    .add_test(Test.builder()
        .name("Test Validation")
        
        .description(
            "Ensure that the validation function " +
            "validates"
        )
        
        .test(() => {
            let user_db = new MockDB();

            let request = new DBRequest({username, password}, user_db);
            request = request.validate(({username, password}, db) => {
                return username === "john_doe"
                    && password === "p@$$w0rd"
                    && db.name === "mock"
            });

            assert(!request.to_json().invalid_input, "Input shouldn't be invalid");

            request = request.validate(({username, password}, db) => false);

            assert(request.to_json().invalid_input, "Input should be valid");
        }))
    
    .add_test(Test.builder()
        .name("Test Server Check")
        
        .description(
            "Ensure that the server check " +
            "checks the server for errors")
        
        .test(() => {
            let user_db = new MockDB();

            let request = new DBRequest({username, password}, user_db);
            request = request.check_db(({username, password}, db) => {
                return username === "john_doe"
                    && db.name === "mock";
            });

            assert(!request.to_json().server_error, "Server error occurred");

            request = request.check_db(({username, password}, db) => false);

            assert(request.to_json().server_error, "Server error did not occur");
        }))
    
    .add_test(Test.builder()
        .name("Test Data Transform")
        
        .description(
            "Test that 'then' works correctly " +
            "and only when it should")
        
        .test(() => {
            let user_db = new MockDB();

            let request = new DBRequest({username, password}, user_db);
            request = request.then(({username, password}, output, db) => {
                return {
                    username,
                    password,
                    db_name: db.name,
                    ...output // Should be empty
                };
            });

            let expected = {
                invalid_input: false,
                server_error: false,
                username: "john_doe",
                password: "p@$$w0rd",
                db_name: "mock"
            };

            assert_eq(JSON.stringify(expected), JSON.stringify(request.to_json()));

            request = request.validate(({username, password}, db) => {
                return false;
            }).then((input, output, db) => {
                return {happened: true, ...output};
            });

            expected = {
                invalid_input: true,
                server_error: false
            };

            assert_eq(JSON.stringify(expected), JSON.stringify(request.to_json()));
        }))
    
    .add_test(Test.builder()
        .name("Test DB Modification")
        
        .description(
            "Ensure that the DB modification " +
            "is done correctly"
        )
        
        .test(() => {
            let user_db = new MockDB();
            let request = new DBRequest({}, user_db);

            request = request.modify_db((input, db) => {
                return db.modify();
            });

            assert(request.get_db().modified);
        }))
    
    .add_test(Test.builder()
        .name("Test Logger")
        
        .description(
            "Ensure that the logger logs " +
            "everything correctly")
        
        .test(() => {
            let user_db = new MockDB();
            let request = new DBRequest({}, user_db);

            request = request.validate((input, db) => true)
                .check_db((input, db) => true)
                .modify_db((input, db) => db)
                .then((input, output, db) => ({}));
            
            let log = [
                "Invalid: false",
                "DB Error: false",
                "Modified DB",
                "Transformed Data"
            ];

            assert_eq(JSON.stringify(log), JSON.stringify(request.get_log()));

            request = new DBRequest({}, user_db);

            request = request.validate((input, db) => false)
                .then((input, output, db) => ({failed: true})); // This should not be run
            
            log = ["Invalid: true"];

            assert_eq(JSON.stringify(log), JSON.stringify(request.get_log()));
        }))
    
    .build();

    TestSuite.run(suite).print_result();
}

try {
    module.exports.DBRequest = exports.DBRequest = DBRequest;
    module.exports.run_tests = exports.run_tests = run_tests;
} catch(error) {}