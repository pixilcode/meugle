const fs = require("fs-extra");

class VerbDB {
    constructor(location) {
        this.location = location;
        this.modified = false;

        try {
            let verbs = fs.readJSONSync(location);
            this.verbs = verbs.map(verb =>
                verb.tenses.reduce((v, tense) => v.tense(tense), new Verb(verb.infinitive))
            );
        } catch (error) {
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

    has(verb, tense = undefined) {
        return this.verbs.some(v => v.infinitive === verb) &&
            (tense === undefined ||
                this.verbs.some(v => v.tenses.some(t => t.tense === tense)));
    }

    get_random(seed) {
        seed = seed || Math.random();
        let verbs = this.verbs
            .map(v => v.tenses.map(
                t => ({ tense: t.tense, verb: v.infinitive })
            ))
            .reduce((prev, curr) => [...prev, ...curr]);
        let loc = Math.floor(seed * verbs.length);
        return verbs[loc];
    }

    get_conj(verb, tense) {
        let { tense: _, ...conj } = this.verbs
            .find(v => v.infinitive === verb)
            .tenses.find(t => t.tense === tense);
        return conj;
    }

    save() {
        if (this.modified) {
            fs.writeJSONSync(this.location, this.verbs, { spaces: "\t" });
            this.modified = false;
        }
    }

    request(input) {
        return new db_req.DBRequest(input, this);
    }
}

class Verb {
    constructor(infinitive) {
        this.infinitive = infinitive;
        this.tenses = [];
    }

    tense(tense) {
        this.tenses.push(new VerbTense(
            tense.tense,
            tense.je,
            tense.tu,
            tense.il,
            tense.nous,
            tense.vous,
            tense.ils));
        return this;
    }
}

class VerbTense {
    constructor(tense, je, tu, il, nous, vous, ils) {
        this.tense = tense;
        this.je = je;
        this.tu = tu;
        this.il = il;
        this.nous = nous;
        this.vous = vous;
        this.ils = ils;
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
    fs.writeJSONSync(db_loc, [
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
                },
                {
                    tense: "past",
                    je: "je2",
                    tu: "tu2",
                    il: "il2",
                    nous: "nous2",
                    vous: "vous2",
                    ils: "ils2"
                }
            ]
        },
        {
            infinitive: "verb2",
            tenses: [
                {
                    tense: "present",
                    je: "je3",
                    tu: "tu3",
                    il: "il3",
                    nous: "nous3",
                    vous: "vous3",
                    ils: "ils3"
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
                let expected = ["verb1", "verb2"];
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
                let expected = ["verb1", "verb2"];
                assert_eq(expected, verb_db.verb_list());

                verb_db = verb_db.add_verb({
                    infinitive: "verb3",
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
                expected.push("verb3");
                assert_eq(expected, verb_db.verb_list());

                verb_db = verb_db.remove_verb("verb3");
                expected = expected.filter(verb => verb !== "verb3");
                assert_eq(expected, verb_db.verb_list());
            }))

        .add_test(Test.builder()
            .name("Test DB Has Verb")

            .description(
                "Test that the verb knows that " +
                "it has a verb and/or tense"
            )

            .test(() => {
                let verb_db = new VerbDB(db_loc);

                assert(verb_db.has("verb1"));
                assert(verb_db.has("verb1", "present"));
                assert(!verb_db.has("non-existent"));
                assert(!verb_db.has("verb1", "non-existent"));
            }))

        .add_test(Test.builder()
            .name("Test Random Verb")

            .description(
                "Test that the random verb " +
                "generator isn't actually random..."
            )

            .test(() => {
                let verb_db = new VerbDB(db_loc);

                let seed = 0.332;
                let expected = {
                    verb: "verb1",
                    tense: "present"
                };
                assert_eq(expected, verb_db.get_random(seed));

                seed = 0.665;
                expected = {
                    verb: "verb1",
                    tense: "past"
                };
                assert_eq(expected, verb_db.get_random(seed));

                seed = 0.999;
                expected = {
                    verb: "verb2",
                    tense: "present"
                };
                assert_eq(expected, verb_db.get_random(seed));
            }))

        .add_test(Test.builder()
            .name("Test Verb Conjugation")

            .description(
                "Ensure the the database correctly " +
                "returns the conjugations for verbs"
            )

            .test(() => {
                let verb_db = new VerbDB(db_loc);
                let result = verb_db.get_conj("verb1", "present");
                let expected = {
                    je: "je1",
                    tu: "tu1",
                    il: "il1",
                    nous: "nous1",
                    vous: "vous1",
                    ils: "ils1"
                };

                assert_eq(expected, result);
            }))

        .build();

    TestSuite.run(suite).print_result();
}

try {
    module.exports.run_tests = exports.run_tests = run_tests;
    module.exports.VerbDB = exports.VerbDB = VerbDB;
} catch (error) { }

run_tests();