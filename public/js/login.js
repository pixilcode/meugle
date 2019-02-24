function validate(method, invalid_message) {
    let username_component = document.querySelector("input[name='username']");
    let password_component = document.querySelector("input[name='password']");

    let username = username_component.value;
    let password = password_component.value;

    let data = JSON.stringify({
        username: username,
        password: password
    });

    fetch("/" + method, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": data.length
        },
        body: data
    }).then((res) => {
        // JSON should be
        // {
        // invalid_input: bool
        // db_error: bool
        // user_id: string
        // }
        res.json().then((result) => {
            console.log(result);
            if(!result.db_error) {
                if(!result.invalid_input) {
                    document.location.href = "/dashboard";
                } else {
                    username_component.value = "";
                    password_component.value = "";
                    error(invalid_message);
                }
            } else {
                username_component.value = "";
                password_component.value = "";
                error("Server error occurred. Please check back later");
            }
        });
    });
}

function show_error(error) {
    console.log(error);
    document.getElementById("error").innerHTML = error;
    document.getElementById("error").style.display = "block";
}