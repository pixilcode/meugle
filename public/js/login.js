function validate() {
    let username = document.querySelector("input[name='username']").value;
    let password = document.querySelector("input[name='password']").value;

    let data = JSON.stringify({
        username: username,
        password: password
    });

    fetch("/validate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Length": data.length
        },
        body: data
    }).then((res) => {
        console.log(res.body);
    });
}