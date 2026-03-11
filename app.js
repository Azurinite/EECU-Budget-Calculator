// Collapse starting text
const collapse = document.querySelector('#collapse')
const bigParagraph = document.querySelector('#startingText')

collapse.addEventListener("click", () => {
    collapse.classList.toggle("collapse")
    bigParagraph.classList.toggle("hidden")
})

// Step navigation
const step_jump = document.querySelector('.step-container');
const forms = document.querySelector('#input-fields');
const nextButton = document.querySelector('.NextBtn');
const backButton = document.querySelector('.BackBtn');

let current_form = forms.children[0];
let current_page = 0;

function renderPage() {
    if (current_form) {
        current_form.classList.add("hidden");
    }
    current_form = forms.children[current_page];
    current_form.classList.add("inputFields");
    current_form.classList.remove("hidden");

    // Sets step based on current_page
    for (const step of step_jump.children) {
        if (Number(step.getAttribute("navTo")) > current_page) {
            step.classList.add("inactive");
            step.classList.remove("active");
        } else {
            step.classList.add("active");
            step.classList.remove("inactive");
        }
    }

    // Remove back button in first page and next button in the last page
    if (current_page == 0) {
        backButton.classList.add("hidden");
    }
    else {
        backButton.classList.remove("hidden");
    }

    if (current_page == 6) {
        nextButton.classList.add("hidden");
    }
    else {
        nextButton.classList.remove("hidden");
    }
}
for (const step of step_jump.children) {
    step.addEventListener("click", () => {

        // Navigate across pages
        current_page = Number(step.getAttribute("navTo"));
        renderPage();
    });
}

// Next button and back button
nextButton.addEventListener("click", () => {
    current_page++;
    renderPage();
})

backButton.addEventListener("click", () => {
    current_page--;
    renderPage();
})


// Chart

/**
 * @param {NodeListOf<HTMLInputElement>} inputs 
 */

function sum(inputs) {
    const arr = Array.from(inputs);
    if (arr.length === 0) return 0;

    const section = arr[0].closest("section");
    if (section && (section.dataset.type === 'income' || section.classList.contains("income"))) {
        return 0;
    }

    return arr.reduce((total, input) => {
        // Receive string of whatever's in the input field
        const raw = String(input.value || '').trim();
        // Remove text if there is any (dude, just make the input fields numeric)
        const cleaned = raw.replace(/[^0-9.\-]/g, '');
        // If it was entirely text, return 0; else get the number
        const n = cleaned === '' ? 0 : Number(cleaned);
        // Add the number to the total if the number is finite...
        return total + (Number.isFinite(n) ? n : 0);
    }, 0)
}

// Get sections
const [...sections] = document.querySelectorAll("section");
// Get the inputs of each section
const filteredSections = Array.from(sections).filter(element => {
    return element.classList.contains('inputs');
});

// Get an array... which houses arrays containing each input for each section (ex. all the inputs in education, all the inputs in housing)
const inputs = filteredSections.map(section =>
    Array.from(section.querySelectorAll("input"))
)

// Get the pie chart
const canvas = document.getElementById("budgetChart") || document.querySelector("canvas");
let current_chart = null;

function update() {
    current_chart?.destroy();
    // Sum up the inputs in each section to get the total of each section (ex. total of Education, total of Housing)
    const dataArray = inputs.map(sectionInputs => sum(sectionInputs));
    console.log('chart data:', dataArray);

    current_chart = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: ["Monthly Income", "Student Loans", "Housing", "Essentials", "Lifestyle", "Future-Proofing"],
            datasets: [{
                label: "Total Expenses",
                data: dataArray,
                backgroundColor: ['#FF4343', '#E943FF', '#FFB743', '#43FFD3', '#5CFF3C']
            }]
        },

        // We'll get the legend (thing representing what colors are what) in HTML/CSS
        options: {
            plugins: {
                legend: {
                    display: false
                }
            },
            responsive: false
        }
    });
}

// Update chart whenever typing in an input field
document.body.addEventListener("input", () => {
    update();
});

update();