function new_tense() {
    let form = document.getElementById("verb-form");
    
    // Create new fieldset for the tense
    let i = 0;
    if(form.querySelector("fieldset")) {
        let fieldsets = form.querySelectorAll("fieldset");
        console.log(document.querySelectorAll("fieldset"));
        i = parseInt(fieldsets[fieldsets.length-1].id.match(/\d+/)[0]) + 1;
    }

    let tense = generate_input_box("Tense", "tense-" + i);
    let je = generate_input_box("Je", "je-" + i);
    let tu = generate_input_box("Tu", "tu-" + i);
    let il = generate_input_box("Il", "il-" + i);
    let nous = generate_input_box("Nous", "nous-" + i);
    let vous = generate_input_box("Vous", "vous-" + i);
    let ils = generate_input_box("Ils", "ils-" + i);

    let fieldset = document.createElement("fieldset");
    fieldset.id = "tense-group-" + i;
    fieldset.append(...tense, ...je, ...tu, ...il, ...nous, ...vous, ...ils);

    form.append(fieldset);
}

function generate_input_box(label, name) {
    let label_element = document.createElement("label");
    label_element.innerText = label + ":";
    label_element.htmlFor = name;

    let input = document.createElement("input");
    input.type = "text";
    input.name = name;
    input.id = name;

    return [label_element, input];
}