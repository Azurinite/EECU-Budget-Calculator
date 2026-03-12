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
    // Hide previous form and show new form
    if (current_form) {
        current_form.classList.add("hidden");
    }
    current_form = forms.children[current_page];
    current_form.classList.add("inputFields");
    current_form.classList.remove("hidden");

    // Sets step based on current_page
    for (const step of step_jump.children) {
        if (Number(step.getAttribute("navTo")) > current_page) {
            step.classList.remove("active");
        } else {
            step.classList.add("active");
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



// Fetch API for income
const careerDropdown = document.querySelector("#careerDropdown")

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

// Function just to grab a url
async function fetchJson(url) {
    const resp = await fetch(url);
    if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
    }
    return resp.json();
}

// Build an unparented list of options containing occupations+jobs
function buildList(jobs = []) {
    // Personal note: createDocumentFragment; imagine it's an element with no name: <>
    // When you parent that to something everything inside the fragment becomes an immediate child of the parent
    const frag = document.createDocumentFragment();
    for (const { Occupation, Salary } of jobs) {
        // Make option element, store occupation name and salarly seperately
        const option = document.createElement('option');

        const occ = document.createElement('div');
        occ.textContent = `${Occupation}: `;
        option.append(occ);

        const sal = document.createElement('div');
        sal.textContent = `${formatter.format(Salary)}`;
        option.append(sal);

        frag.append(option);
    }
    return frag;
}

// Load the list of occupations
async function init() {
    const root = document.querySelector(':root');
    const url = 'https://eecu-data-server.vercel.app/data';

    try {
        const jobs = await fetchJson(url);
        // Append the array of options to the dropdown
        careerDropdown.append(buildList(jobs));
    } catch (err) {
        // If there's an error... the page will tell you. Whoops
        root.style.color = 'red';
        root.textContent = `Error: ${err.message}`;
    }
}

document.addEventListener('DOMContentLoaded', init)



// Chart
const [...expenseDisplays] = document.querySelectorAll('.expenseDisplay')
const [...inputFields] = document.querySelectorAll('.inputs')

const totalIncomeDisplay = document.querySelector('#totalIncome p')
const totalExpenseDisplay = document.querySelector('#totalExpenses p')
const netIncomeDisplay = document.querySelector('#NetIncome p')

/**
 * @param {NodeListOf<HTMLInputElement>} inputs 
 */

function sum(inputs) {
    const arr = Array.from(inputs);
    if (arr.length === 0) return 0;

    return arr.reduce((total, input) => {
        // Receive string of whatever's in the input field
        const raw = String(input.value || '').trim();
        // Remove text if there is any, somehow
        const cleaned = raw.replace(/[^0-9.\-]/g, '');
        // If it was entirely text, return 0; else get the number
        const n = cleaned === '' ? 0 : Number(cleaned);
        // Add the number to the total if the number is finite, else add 0
        return total + (Number.isFinite(n) ? n : 0);
    }, 0)
}

// Get sections.. this was previously calling EVERY section in the DOM. Personal note if I edit again later
const [...sections] = document.querySelectorAll("section:not(.income)");
// Get the inputs of each section
const filteredSections = Array.from(sections).filter(element => {
    return element.classList.contains('inputs');
});

// Get an array... which houses arrays containing each input for each section (ex. all the inputs in education, all the inputs in housing)
const inputs = filteredSections.map(section =>
    Array.from(section.querySelectorAll("input"))
);



// Get income input fields
const incomeInputs = document.querySelectorAll('#incomeInputs input')


// Get the pie chart
const canvas = document.getElementById("budgetChart") || document.querySelector("canvas");
let current_chart = null;

function updateAll() {
    current_chart?.destroy();
    // Sum up the inputs in each section to get the total of each section (ex. total of Education, total of Housing)
    const dataArray = inputs.map(sectionInputs => sum(sectionInputs));
    console.log('chart data:', dataArray);

    // Show income (career dropdown + filling out other fields)
    let totalIncome = 0

    const careerSelected = careerDropdown.value
    console.log(careerSelected)
    if (careerSelected) {
        const careerSalary = careerSelected.slice(careerSelected.indexOf('$') + 1)
        careerSalary.replace(",","")
        console.log(careerSalary)
    }

    totalIncome += sum(incomeInputs);
    totalIncomeDisplay.textContent = `$${totalIncome}`;

    // Update shown expense values
    let totalExpenses = 0;
    for (const index in expenseDisplays) {
        const spent = dataArray[index];
        expenseDisplays[index].textContent = `$${spent}`;
        totalExpenses += spent;
    }
    totalExpenseDisplay.textContent = `$${totalExpenses}`;

    // Show Net Income
    const netIncome = totalIncome - totalExpenses;
    // Change color of net income based on positive/negative profit
    if (netIncome >= 0) {
        netIncomeDisplay.style.color = 'var(--saving-green)'
        netIncomeDisplay.textContent = `$${netIncome}`
    } else {
        netIncomeDisplay.style.color = 'var(--debt-red)'
        netIncomeDisplay.textContent = `-$${ Math.abs(netIncome) }`
    }

    // Update Chart
    current_chart = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: ["Student Loans", "Housing", "Essentials", "Lifestyle", "Future-Proofing"],
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
            responsive: false,
            animations: false
        }
    });
}

// Update chart whenever typing in an input field
document.body.addEventListener("input", () => {
    updateAll();
});
document.body.addEventListener("select", () => {
    updateAll();
});

updateAll();