// Collapse starting text
const collapse = document.querySelector('#collapse')
const bigParagraph = document.querySelector('#startingText')

const savedInputData = loadData("Data") || []

// LocalStorage saving functions, so I don't accidentally forget to JSON.parse()
function saveData(keyName, data) {
    localStorage.setItem(keyName, JSON.stringify(data))
}
function loadData(keyName) {
    try {
        return JSON.parse(localStorage.getItem(keyName))
    } catch (err) {
        console.log("Returned empty table: " + err)
        return []
    }
}

collapse.addEventListener("click", () => {
    collapse.classList.toggle("collapse")
    bigParagraph.classList.toggle("hidden")
})

// Step navigation
const step_jump = document.querySelector('.step-container');
const forms = document.querySelector('#input-fields');
const nextButton = document.querySelector('.NextBtn');
const backButton = document.querySelector('.BackBtn');
const returnToFirstPage = document.querySelector('#returnToFirstPage')

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

    // Scroll page to inputs
    document.querySelector('.Buttons').scrollIntoView({ block: "end", behavior: 'smooth' });
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

returnToFirstPage.addEventListener("click", () => {
    current_page = 0;
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
        option.value = `${Occupation}: ${formatter.format(Salary)}`

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
        // We're loading the saved career value here cuz anywhere else will cause the code to run before the options load...
        careerDropdown.selectedIndex = loadData("careerIndex")
        updateAll();
    } catch (err) {
        // If there's an error... the page will tell you. Whoops
        root.style.color = 'red';
        root.textContent = `Error: ${err.message}`;
    }
}

document.addEventListener('DOMContentLoaded', init)



// Chart
const chartContainer = document.querySelector('#chartStyler')
const chartPlaceholderText = document.querySelector('#chartPlaceholder')

const [...expenseDisplays] = document.querySelectorAll('.expenseDisplay')
const [...inputFields] = document.querySelectorAll('.inputs')

const totalIncomeDisplay = document.querySelector('#totalIncome p')
const totalExpenseDisplay = document.querySelector('#totalExpenses p')
const netIncomeDisplay = document.querySelector('#NetIncome p')

const incomeInputs = document.querySelectorAll('#incomeInputs input')

// Get sections housing expense input fields
const [...sections] = document.querySelectorAll("section:not(.income)");
const filteredSections = Array.from(sections).filter(element => {
    return element.classList.contains('inputs');
});
// Get an array... which houses arrays containing each input for each section (ex. all the inputs in education, all the inputs in housing)
const inputs = filteredSections.map(section =>
    Array.from(section.querySelectorAll("input"))
);

let preloadedInputValues = loadData("inputValues");
console.log(preloadedInputValues);
// Check if there were input values saved (weird way to check, I know)

function saveInputValues() {
    preloadedInputValues = [];
    // FOR INCOME
    // Dropdown
    const career = careerDropdown.selectedIndex;
    saveData("careerIndex", career)

    // Inputs
    const incomeSection = []
    preloadedInputValues.push(incomeSection)
    for (const input of incomeInputs) {
        incomeSection.push(input.value || '')
    };

    // FOR EXPENSES
    // Make a fresh slate of input values to save if not
    inputs.forEach((inputSection, sectionIndex) => {
        const valuesInSection = []
        preloadedInputValues.push(valuesInSection);
        for (const input of inputSection) {
            // Set to seen input value, or to an empty string
            valuesInSection.push(input.value || '');
        }
    });
    saveData("inputValues", preloadedInputValues);
}

// Load all the saved input values when the website loads

if (preloadedInputValues) {
    preloadedInputValues.forEach((inputSection, sectionIndex) => {
        inputSection.forEach((inputValue, inputIndex) => {
            // I know this is really scuffed... this is to account for income inputs and normal inputs being split up
            if (sectionIndex == 0) {
                incomeInputs[inputIndex].value = inputValue || ''
            } else {
                inputs[sectionIndex - 1][inputIndex].value = inputValue || '';
            }
        })
    })
}

// Sum the values of all inputs in a category (ex. total in education, total in housing)
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

// Function for formatting money text
function formatMoney(dollars) {
    // This method converts numbers to have money formatting, apparently
    const text = dollars.toLocaleString("en-US", {
        minimumFractionDigits: 2, // Always show cents
        maximumFractionDigits: 2
    });

    return `$${text}`;
}

// Calculate taxes on a salary
function taxSalary(salary) {
    // Taxes to apply at some point
    const medicare = 0.0145;
    const socialSecurity = 0.062;
    const stateTax = 0.04;

    const progressiveTax = () => {
        const deductible = 16100;
        const salAfterDeduct = (salary - deductible)

        const tenPercentThreshold = 12400;
        const twelvePercentThreshold = 50400;

        let totalAmtTaxed = 0

        const bracket1 = () => {
            // Get max cash that can be put in the bracket
            const salInLowBracket = Math.min(salAfterDeduct, tenPercentThreshold);
            console.log(salInLowBracket)

            const lowTaxRate = 0.1;
            totalAmtTaxed += salInLowBracket * lowTaxRate;
        };
        const bracket2 = () => {
            // Salary that would be taxed in the second bracket
            const salToTax = salAfterDeduct - tenPercentThreshold;
            console.log(salToTax)

            if (salToTax > 0) {
                // Get max cash that can be put in the bracket
                const salInMiddleBracket = Math.min(salToTax, twelvePercentThreshold)
                const midTaxRate = 0.12;
                totalAmtTaxed += salInMiddleBracket * midTaxRate;
            }
        };
        const bracket3 = () => {
            const salInHighBracket = salAfterDeduct - twelvePercentThreshold
            console.log(salInHighBracket)

            if (salInHighBracket > 0) {
                const highTaxRate = 0.22;
                totalAmtTaxed += salInHighBracket * highTaxRate;
            }
        };

        bracket1();
        bracket2();
        bracket3();

        return totalAmtTaxed;
    };

    // All taxes are applied at the same time
    const medicareTaxed = salary * medicare;
    const socialSecurityTaxed = salary * socialSecurity;
    const stateTaxed = salary * stateTax;
    const progressiveTaxed = progressiveTax();

    const totalTaxed = (medicareTaxed + socialSecurityTaxed + stateTaxed + progressiveTaxed);

    // Return salary after taxes are taken off
    return salary - totalTaxed;
}


// Functions for summing & displaying income or expenses
const getIncome = () => {
    let totalIncome = 0

    // careerSelected string has occupation name + salary in it
    const careerSelected = careerDropdown.value;
    if (careerSelected) {
        // Grabbing only the numbers in the salary part of the careerSelected string
        const careerSalary = Number(careerSelected.split('$')[1].replace(/[^0-9.\-]/g, ''));
        const taxedSalary = taxSalary(careerSalary)
        totalIncome += taxedSalary;
    }
    // Income from other input fields
    totalIncome += sum(incomeInputs);

    return totalIncome
}

function getTotalExpenses(spentPerCategory) {
    // Update shown expense values
    let totalExpenses = 0;
    for (const index in expenseDisplays) {
        const spent = spentPerCategory[index];
        expenseDisplays[index].textContent = formatMoney(spent);
        totalExpenses += spent;
    }

    return totalExpenses
}

// Get the pie chart
const canvas = document.getElementById("budgetChart") || document.querySelector("canvas");
let current_chart = null;

// Update showing budget at the left
function updateAll() {
    // Sum up the inputs in each section to get the total of each section (ex. total of Education, total of Housing)
    const dataArray = inputs.map(sectionInputs => sum(sectionInputs));

    // Show income (career dropdown + filling out other fields)
    let totalIncome = getIncome();
    totalIncomeDisplay.textContent = formatMoney(totalIncome);

    // Show and update expenses
    let totalExpenses = getTotalExpenses(dataArray);
    totalExpenseDisplay.textContent = formatMoney(totalExpenses);

    // Show Net Income
    const netIncome = totalIncome - totalExpenses;
    // Change color of net income based on positive/negative profit
    if (netIncome >= 0) {
        netIncomeDisplay.style.color = 'var(--saving-green)';
        netIncomeDisplay.textContent = formatMoney(netIncome);
    } else {
        netIncomeDisplay.style.color = 'var(--debt-red)'
        netIncomeDisplay.textContent = `-${formatMoney(Math.abs(netIncome))}` // Notice there's a negative sign there
    }


    // Update Chart
    // Show the chart only if user has put in expenses
    const anyExpensesInput = dataArray.find(expense => expense > 0);
    if (anyExpensesInput) {
        chartPlaceholderText.classList.add('hidden')
        chartContainer.classList.remove('hidden')

        // Actually making & updating chart
        current_chart?.destroy();
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
                animations: false
            }
        });
    } else {
        // Hide chart and give placeholder text if user hasn't put in any expenses yet
        chartPlaceholderText.classList.remove('hidden')
        chartContainer.classList.add('hidden')
    }
}

// Update chart whenever typing in an input field
document.body.addEventListener("input", () => {
    updateAll();
    saveInputValues();
});
document.body.addEventListener("select", () => {
    updateAll();
    saveInputValues();
});