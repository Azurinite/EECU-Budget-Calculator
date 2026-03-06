const step_jump = document.querySelector('.step-container');
const forms = document.querySelector('#input-fields');

// Step navigation
let current_form = forms.children[0];
let current_page = 0;

for (const step of step_jump.children) {
    step.addEventListener("click", () => {

        // Navigate across pages
        current_page = Number(step.getAttribute("navTo"));
        if(current_form) {
            current_form.classList.add("hidden");
        }
        current_form = forms.children[current_page];
        current_form.classList.add("inputFields");
        current_form.classList.remove("hidden");

        // Sets step based on current_page
        for (const step of step_jump.children) {
            if(Number(step.getAttribute("navTo")) > current_page) {
                step.classList.add("inactive");
                step.classList.remove("active");
            } else {
                step.classList.add("active");
                step.classList.remove("inactive");
            }
        }
    });
}

// Chart