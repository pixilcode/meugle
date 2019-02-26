const fs = require("fs-extra");

class TemplateFile {
    constructor(path) {
        this.file = fs.readFileSync(path, "utf8");
    }

    variable(name, value) {
        this.file = this.file
            .split("{{" + name + "}}")
            .join(value);
        return this;
    }

    toString() {
        return this.file;
    }
}

function run_tests() {
    const test = require("./test/test");
    const path = require("path");
    const os = require("os");

    const Test = test.Test;
    const TestSuite = test.TestSuite;
    const assert = test.assert;
    const assert_eq = test.assert_eq;

    let temp_dir = fs.mkdtempSync(path.join(os.tmpdir(), "db-"));

    // Write the normal file
    let file_loc = path.join(temp_dir, "normal.html");
    let html =
"<html>\
<head></head>\
<body>{{text}}</body>\
</html>"
    fs.writeFileSync(file_loc, html);
    
    let suite = TestSuite.builder()
        .name("Template File Tests")

        .description("Test the features of the template file")

        .add_test(Test.builder()
            .name("Test Init")
            
            .description(
                "Ensure that the file can be initiated"
            )
            
            .test(() => {
                let file = new TemplateFile(file_loc);
                let result = file.toString();
                assert_eq(html, result);
            }))
        
        .add_test(Test.builder()
            .name("Test Variable Replace")
            
            .description(
                "Test whether variables are " +
                "replaced correctly"
            )
            
            .test(() => {
                let file = new TemplateFile(file_loc)
                    .variable("text", "replaced");
                let result = file.toString();
                let expected =
"<html>\
<head></head>\
<body>replaced</body>\
</html>"

                assert_eq(expected, result);
            }))
        
        .build();

    TestSuite.run(suite).print_result();
}

try {
    module.exports.run_tests = exports.run_tests = run_tests;
    module.exports.TemplateFile = exports.TemplateFile = TemplateFile;
} catch(error) {}