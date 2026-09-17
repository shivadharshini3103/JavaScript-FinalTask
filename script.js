/* ==========================================================
   EMPLOYEE MANAGEMENT SYSTEM - script.js
   Concepts used: fetch, Promise, .then, .catch, .finally,
   objects, arrays, forEach, filter, includes, reduce, sort,
   createElement, innerHTML, event listeners, Date
   ========================================================== */

/* ---------- 1. GLOBAL STATE ---------- */

let employees = [];            // master array - every employee lives here
let currentDepartment = "All"; // which department button is active
let currentSearch = "";        // what the user typed in the search box
let currentSort = "none";      // which sort option is selected
let nextId = 1000;             // id generator for locally added employees

/* ---------- 2. GRAB THE DOM ELEMENTS ONCE ---------- */

const statusMessage = document.getElementById("statusMessage");
const employeeList = document.getElementById("employeeList");
const employeeCount = document.getElementById("employeeCount");
const countLabel = document.getElementById("countLabel");
const totalSalaryEl = document.getElementById("totalSalary");
const averageSalaryEl = document.getElementById("averageSalary");
const topNameEl = document.getElementById("topName");
const topSalaryEl = document.getElementById("topSalary");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const departmentButtons = document.getElementById("departmentButtons");
const sortSelect = document.getElementById("sortSelect");

const nameInput = document.getElementById("nameInput");
const ageInput = document.getElementById("ageInput");
const emailInput = document.getElementById("emailInput");
const phoneInput = document.getElementById("phoneInput");
const departmentInput = document.getElementById("departmentInput");
const salaryInput = document.getElementById("salaryInput");
const formError = document.getElementById("formError");
const addBtn = document.getElementById("addBtn");

const todayDate = document.getElementById("todayDate");
const todayTime = document.getElementById("todayTime");

/* ==========================================================
   3. FETCH EMPLOYEES FROM THE API
   ========================================================== */

function fetchEmployees() {
  showStatus("Loading employees...", "loading");

  fetch("https://dummyjson.com/users?limit=30")
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Server responded with " + response.status);
      }
      return response.json();          // convert response to a JS object
    })
    .then(function (data) {
      // data.users is the array coming from the API
      data.users.forEach(function (user) {
        employees.push(createEmployeeFromApi(user));
      });
      showStatus("Employee data loaded successfully.", "success");
      refreshDashboard();
    })
    .catch(function (error) {
      console.log("API error:", error);
      showStatus("Unable to load employee data. Please try again.", "error");
      refreshDashboard();              // still show the empty state cleanly
    })
    .finally(function () {
      console.log("fetchEmployees() finished running.");
    });
}

/* Turn one API user object into our own simpler employee object */
function createEmployeeFromApi(user) {
  return {
    id: user.id,
    name: user.firstName + " " + user.lastName,
    age: user.age,
    email: user.email,
    phone: user.phone,
    department: mapDepartment(user.company.department),
    image: user.image,
    salary: generateSalary(user)
  };
}

/* The API sends departments like "Engineering" or "Sales".
   We map them onto the four departments used in this project. */
function mapDepartment(apiDepartment) {
  const it = ["Engineering", "Research and Development", "Support", "Services", "Product Management"];
  const hr = ["Human Resources", "Training"];
  const finance = ["Accounting", "Legal", "Business Development"];
  const marketing = ["Marketing", "Sales"];

  if (it.includes(apiDepartment)) return "IT";
  if (hr.includes(apiDepartment)) return "HR";
  if (finance.includes(apiDepartment)) return "Finance";
  if (marketing.includes(apiDepartment)) return "Marketing";
  return "IT";
}

/* The API has no salary field, so we build one from the data we do have */
function generateSalary(user) {
  return 30000 + user.age * 800 + (user.id * 1373) % 25000;
}

/* ==========================================================
   4. DISPLAY EMPLOYEES
   ========================================================== */

function displayEmployees(list) {
  employeeList.innerHTML = "";        // clear the old cards first

  if (list.length === 0) {
    employeeList.innerHTML = '<p class="empty-message">No employees match this search or filter.</p>';
    return;
  }

  list.forEach(function (employee) {
    const card = document.createElement("div");
    card.className = "employee-card";

    card.innerHTML =
      '<img src="' + (employee.image || "") + '" alt="' + employee.name + '" />' +
      "<h3>" + employee.name + "</h3>" +
      '<span class="badge">' + employee.department + "</span>" +
      "<p>Age: " + employee.age + "</p>" +
      "<p>Email: " + employee.email + "</p>" +
      "<p>Phone: " + employee.phone + "</p>" +
      '<p class="salary-line">Salary: ' + formatMoney(employee.salary) + "</p>";

    // Delete button is created separately so we can attach a listener
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", function () {
      deleteEmployee(employee.id);
    });

    card.appendChild(deleteBtn);
    employeeList.appendChild(card);
  });
}

/* ==========================================================
   5. SEARCH
   ========================================================== */

function searchEmployees(list) {
  if (currentSearch === "") {
    return list;
  }
  return list.filter(function (employee) {
    return employee.name.toLowerCase().includes(currentSearch.toLowerCase());
  });
}

/* ==========================================================
   6. DEPARTMENT FILTER
   ========================================================== */

function filterDepartment(list) {
  if (currentDepartment === "All") {
    return list;
  }
  return list.filter(function (employee) {
    return employee.department === currentDepartment;
  });
}

/* ==========================================================
   7. SORT
   ========================================================== */

function sortEmployees(list) {
  const sorted = list.slice();   // copy so the master array stays untouched

  if (currentSort === "name-asc") {
    sorted.sort(function (a, b) { return a.name.localeCompare(b.name); });
  } else if (currentSort === "name-desc") {
    sorted.sort(function (a, b) { return b.name.localeCompare(a.name); });
  } else if (currentSort === "age-asc") {
    sorted.sort(function (a, b) { return a.age - b.age; });
  } else if (currentSort === "age-desc") {
    sorted.sort(function (a, b) { return b.age - a.age; });
  } else if (currentSort === "salary-asc") {
    sorted.sort(function (a, b) { return a.salary - b.salary; });
  } else if (currentSort === "salary-desc") {
    sorted.sort(function (a, b) { return b.salary - a.salary; });
  }

  return sorted;
}

/* ==========================================================
   8. COUNT + SALARY CALCULATIONS
   ========================================================== */

function updateEmployeeCount(list) {
  employeeCount.textContent = list.length;

  if (currentDepartment === "All") {
    countLabel.textContent = "Total Employees";
  } else {
    countLabel.textContent = currentDepartment + " Employees";
  }
}

function calculateSalary(list) {
  // total salary using reduce()
  const total = list.reduce(function (sum, employee) {
    return sum + employee.salary;
  }, 0);

  // average salary = total / length
  const average = list.length === 0 ? 0 : Math.round(total / list.length);

  totalSalaryEl.textContent = formatMoney(total);
  averageSalaryEl.textContent = formatMoney(average);

  findHighestPaid(list);
}

/* Highest paid employee using reduce() */
function findHighestPaid(list) {
  if (list.length === 0) {
    topNameEl.textContent = "--";
    topSalaryEl.textContent = formatMoney(0);
    return;
  }

  const top = list.reduce(function (highest, employee) {
    return employee.salary > highest.salary ? employee : highest;
  });

  topNameEl.textContent = top.name;
  topSalaryEl.textContent = formatMoney(top.salary);
}

/* ==========================================================
   9. ADD EMPLOYEE
   ========================================================== */

function addEmployee() {
  const newEmployee = {
    id: nextId++,
    name: nameInput.value.trim(),
    age: Number(ageInput.value),
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim() || "Not provided",
    department: departmentInput.value,
    salary: Number(salaryInput.value) || 0,
    image: ""
  };

  if (!validateEmployee(newEmployee)) {
    return;   // validation failed, stop here
  }

  employees.push(newEmployee);
  showFormMessage(newEmployee.name + " was added to the list.", true);
  clearForm();
  refreshDashboard();
}

/* ==========================================================
   10. VALIDATION
   ========================================================== */

function validateEmployee(employee) {
  if (employee.name === "") {
    showFormMessage("Please enter employee name", false);
    return false;
  }

  if (!employee.age || employee.age <= 18) {
    showFormMessage("Age must be greater than 18", false);
    return false;
  }

  if (employee.email === "") {
    showFormMessage("Please enter employee email", false);
    return false;
  }

  if (!employee.email.includes("@") || !employee.email.includes(".")) {
    showFormMessage("Please enter a valid email address", false);
    return false;
  }

  if (employee.department === "") {
    showFormMessage("Please select a department", false);
    return false;
  }

  if (employee.salary <= 0) {
    showFormMessage("Please enter a salary greater than 0", false);
    return false;
  }

  return true;
}

/* ==========================================================
   11. DELETE EMPLOYEE
   ========================================================== */

function deleteEmployee(id) {
  employees = employees.filter(function (employee) {
    return employee.id !== id;
  });
  refreshDashboard();
}

/* ==========================================================
   12. FORM HELPERS
   ========================================================== */

function clearForm() {
  nameInput.value = "";
  ageInput.value = "";
  emailInput.value = "";
  phoneInput.value = "";
  departmentInput.value = "";
  salaryInput.value = "";
}

function showFormMessage(message, isSuccess) {
  formError.textContent = isSuccess ? "✅ " + message : "❌ " + message;
  formError.className = isSuccess ? "form-error form-success" : "form-error";
}

function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = "status status-" + type;
}

/* Format a number as Indian rupees: 155000 -> ₹1,55,000 */
function formatMoney(amount) {
  return "₹" + amount.toLocaleString("en-IN");
}

/* ==========================================================
   13. DATE AND TIME
   ========================================================== */

function showDateTime() {
  const months = ["January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"];

  const now = new Date();

  const day = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();

  let hours = now.getHours();
  const minutes = now.getMinutes();
  const period = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  if (hours === 0) hours = 12;

  const paddedMinutes = minutes < 10 ? "0" + minutes : minutes;

  todayDate.textContent = "Today: " + day + " " + month + " " + year;
  todayTime.textContent = "Time: " + hours + ":" + paddedMinutes + " " + period;
}

/* ==========================================================
   14. THE ONE FUNCTION THAT REDRAWS EVERYTHING
   filter by department -> search -> sort -> display
   ========================================================== */

function refreshDashboard() {
  let visible = filterDepartment(employees);
  visible = searchEmployees(visible);
  visible = sortEmployees(visible);

  displayEmployees(visible);
  updateEmployeeCount(visible);
  calculateSalary(visible);
}

/* ==========================================================
   15. EVENT LISTENERS
   ========================================================== */

searchBtn.addEventListener("click", function () {
  currentSearch = searchInput.value.trim();
  refreshDashboard();
});

// live search as the user types
searchInput.addEventListener("input", function () {
  currentSearch = searchInput.value.trim();
  refreshDashboard();
});

clearSearchBtn.addEventListener("click", function () {
  searchInput.value = "";
  currentSearch = "";
  refreshDashboard();
});

// one listener for all five department buttons (event delegation)
departmentButtons.addEventListener("click", function (event) {
  const button = event.target;
  if (button.tagName !== "BUTTON") return;

  currentDepartment = button.dataset.dept;

  // highlight the active button
  const allChips = departmentButtons.querySelectorAll(".chip");
  allChips.forEach(function (chip) {
    chip.classList.remove("chip-active");
  });
  button.classList.add("chip-active");

  refreshDashboard();
});

sortSelect.addEventListener("change", function () {
  currentSort = sortSelect.value;
  refreshDashboard();
});

addBtn.addEventListener("click", addEmployee);

/* ==========================================================
   16. START THE APP
   ========================================================== */

showDateTime();
setInterval(showDateTime, 1000);   // keep the clock ticking
fetchEmployees();