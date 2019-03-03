const user_db = require("./user_db");
const verb_db = require("./verb_db");

function run_tests() {
    user_db.run_tests();
    verb_db.run_tests();
}

try {
    module.exports.run_tests = exports.run_tests = run_tests;
    module.UserDB = exports.UserDB = user_db.UserDB;
    module.VerbDB = exports.VerbDB = verb_db.VerbDB;
    module.generate_salt = exports.generate_salt = user_db.generate_salt;
} catch(error) {}