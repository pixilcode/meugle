let searchbar = undefined;

function search() {
	searchbar = searchbar || document.querySelector("input[type='search']");
	let verbs = document.querySelectorAll("ul#verbs li");

	if (searchbar.value === "")
		for (let verb of verbs)
			verb.hidden = false;
	else {
		for (let verb of verbs)
			if (verb.textContent.includes(searchbar.value))
				verb.hidden = false;
			else
				verb.hidden = true;
	}

}