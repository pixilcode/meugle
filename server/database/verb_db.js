const fs = require("fs-extra");

class VerbDB {
    constructor(location) {
        this.location = location;
        this.modified = false;

        try {
            this.verbs = fs.readJSONSync(location);
        } catch(error) {
            this.verbs = [];
        }
    }

    verb_list() {
        return this.verbs.map(verb => verb.infinitive);
    }

    add_verb(verb) {
        this.verbs.push(verb);
        this.modified = true;
        return this;
    }

    remove_verb(verb) {
        this.verbs = this.verbs.filter(v => v.infinitive !== verb);
        this.modified = true;
        return this;
    }

    save() {
        if(this.modified) {
            fs.writeJSONSync(this.location, this.verbs, { spaces: "\t"});
            this.modified = false;
        }
    }

    request(input) {
        return new db_req.DBRequest(input, this);
    }
}

function run_tests() {
    const test = require("../test/test");
    const path = require("path");
    const os = require("os");

    const Test = test.Test;
    const TestSuite = test.TestSuite;
    const assert = test.assert;
    const assert_eq = test.assert_eq;
    const assert_neq = test.assert_neq;

    let temp_dir = fs.mkdtempSync(path.join(os.tmpdir(), "db-"));

    // Write the normal database
    let db_loc = path.join(temp_dir, "verbs.json");
    fs.writeJSONSync(db_loc,[
        {
            infinitive: "verb1",
            tenses: [
                {
                    tense: "present",
                    je: "je1",
                    tu: "tu1",
                    il: "il1",
                    nous: "nous1",
                    vous: "vous1",
                    ils: "ils1"
                }
            ]
        }
    ]);

    let suite = TestSuite.builder()
    .name("Verb Database Tests")

    .description("Test that each database function works")

    .add_test(Test.builder()
        .name("Test Verb List")
        
        .description(
            "Test that the database can " +
            "be initiated"
        )
        
        .test(() => {
            let verb_db = new VerbDB(db_loc);
            let expected = ["verb1"];
            assert_eq(expected, verb_db.verb_list());
        }))
    
    .add_test(Test.builder()
        .name("Test Add/Remove Verb")
        
        .description(
            "Test that verbs can be added/" +
            "removed to the database"
        )
        
        .test(() => {
            let verb_db = new VerbDB(db_loc);
            let expected = ["verb1"];
            assert_eq(expected, verb_db.verb_list());

            verb_db = verb_db.add_verb({
                infinitive: "verb2",
                tenses: [{
                    tense: "present",
                    je: "a",
                    tu: "b",
                    il: "c",
                    nous: "d",
                    vous: "e",
                    ils: "f"
                }]
            });
            expected.push("verb2");
            assert_eq(expected, verb_db.verb_list());

            verb_db = verb_db.remove_verb("verb2");
            expected = expected.filter(verb => verb !== "verb2");
            assert_eq(expected, verb_db.verb_list());
        }))
    
    .build();
    
    TestSuite.run(suite).print_result();
}

try {
    module.exports.run_tests = exports.run_tests = run_tests;
    module.exports.VerbDB = exports.VerbDB = VerbDB;
} catch(error) {}