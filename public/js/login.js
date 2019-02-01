function validate() {
    let username_component = document.querySelector("input[name='username']");
    let password_component = document.querySelector("input[name='password']");

    let username = username_component.value;
    let password = password_component.value;

    let a = {
        username: username,
        password: password
    }

    let data = JSON.stringify({
        username: username,
        password: password
    });

    fetch("/validate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": data.length
        },
        body: data
    }).then((res) => {
        res.json().then((result) => {
            if(result.successful) {
                document.location.href = "/dashboard"
            } else {
                username_component.value = "";
                password_component.value = "";
                show_error(true);
            }
        });
    });
}

function show_error(show) {
    document.getElementById("error").style.display = "block";
}