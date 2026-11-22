class Student {
  #name;
  #grade1;
  #grade2;
  #grade3;
  #attendance;

  constructor(name, grade1, grade2, grade3, attendance) {
    this.name = name;
    this.grade1 = grade1;
    this.grade2 = grade2;
    this.grade3 = grade3;
    this.attendance = attendance;
  }

  set name(value) {
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error("يرجى إدخال اسم الطالب.");
    }
    this.#name = value.trim();
  }

  get name() {
    return this.#name;
  }

  #setGrade(fieldName, value) {
    if (value === "" || value === null || value === undefined) {
      throw new Error(`يرجى إدخال ${fieldName}.`);
    }

    const number = Number(value);
    if (!Number.isFinite(number)) {
      throw new Error(`يجب أن تكون درجة ${fieldName} رقماً.`);
    }
    if (number < 0 || number > 100) {
      throw new Error(`يجب أن تكون درجة ${fieldName} بين 0 و 100.`);
    }

    return number;
  }

  set grade1(value) {
    this.#grade1 = this.#setGrade("المادة الأولى", value);
  }

  get grade1() {
    return this.#grade1;
  }

  set grade2(value) {
    this.#grade2 = this.#setGrade("المادة الثانية", value);
  }

  get grade2() {
    return this.#grade2;
  }

  set grade3(value) {
    this.#grade3 = this.#setGrade("المادة الثالثة", value);
  }

  get grade3() {
    return this.#grade3;
  }

  set attendance(value) {
    if (value === "" || value === null || value === undefined) {
      throw new Error("يرجى إدخال نسبة الحضور.");
    }

    const number = Number(value);
    if (!Number.isFinite(number)) {
      throw new Error("يجب أن تكون نسبة الحضور رقماً.");
    }
    if (number < 0 || number > 100) {
      throw new Error("يجب أن تكون نسبة الحضور بين 0 و 100.");
    }

    this.#attendance = number;
  }

  get attendance() {
    return this.#attendance;
  }

  getAverage() {
    return (this.#grade1 + this.#grade2 + this.#grade3) / 3;
  }
}

const studentsList = [];

const studentForm = document.getElementById("studentForm");
const studentNameInput = document.getElementById("studentName");
const grade1Input = document.getElementById("grade1");
const grade2Input = document.getElementById("grade2");
const grade3Input = document.getElementById("grade3");
const attendanceInput = document.getElementById("attendance");
const addStudentBtn = document.getElementById("addStudentBtn");
const mercyBtn = document.getElementById("mercyBtn");
const errorBox = document.getElementById("errorBox");
const successBox = document.getElementById("successBox");
const studentsListBox = document.getElementById("studentsList");
const studentCount = document.getElementById("studentCount");
const reportBox = document.getElementById("reportBox");

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}

function showError(message) {
  successBox.textContent = "";
  successBox.classList.add("d-none");
  errorBox.textContent = message;
  errorBox.classList.remove("d-none");
}

function showSuccess(message) {
  errorBox.textContent = "";
  errorBox.classList.add("d-none");
  successBox.textContent = message;
  successBox.classList.remove("d-none");
}

function clearMessages() {
  errorBox.textContent = "";
  errorBox.classList.add("d-none");
  successBox.textContent = "";
  successBox.classList.add("d-none");
}

function renderStudents() {
  if (studentsList.length === 0) {
    studentsListBox.innerHTML = '<p class="empty-state mb-0">لا يوجد طلاب مضافون حتى الآن.</p>';
  } else {
    studentsListBox.innerHTML = studentsList.map((student, index) => `
      <div class="student-row">
        <span class="student-index">${index + 1}</span>
        <span class="student-name">${escapeHtml(student.name)}</span>
        <span class="student-average">المتوسط: ${student.getAverage().toFixed(2)}</span>
      </div>
    `).join("");
  }

  studentCount.textContent = `${studentsList.length} ${studentsList.length === 1 ? "طالب" : "طلاب"}`;
}

studentForm.addEventListener("submit", (event) => {
  event.preventDefault();

  try {
    clearMessages();

    const student = new Student(
      studentNameInput.value,
      grade1Input.value,
      grade2Input.value,
      grade3Input.value,
      attendanceInput.value
    );

    studentsList.push(student);
    renderStudents();
    studentForm.reset();
    showSuccess(`تمت إضافة الطالب ${student.name} بنجاح.`);
    studentNameInput.focus();
  } catch (error) {
    showError(error.message);
  }
});

mercyBtn.addEventListener("click", () => {
  const strugglingStudents = studentsList.filter((student) => {
    const average = student.getAverage();
    return average >= 40 && average <= 49;
  });

  if (strugglingStudents.length === 0) {
    reportBox.innerHTML = `
      <div class="report-grid">
        <div class="report-stat">
          عدد الطلاب المتعثرين
          <strong>0</strong>
        </div>
        <div class="report-stat">
          المتوسط العام بعد الرأفة
          <strong>غير متاح</strong>
        </div>
      </div>
      <p class="empty-state mt-3 mb-0">لا يوجد طلاب متعثرون حاليًا.</p>
    `;
    return;
  }

  const mercyStudents = strugglingStudents.map((student) => {
    const newAverage = student.getAverage() + 5;
    return {
      name: student.name,
      newAverage
    };
  });

  const generalAverage = mercyStudents.reduce((sum, student) => {
    return sum + student.newAverage;
  }, 0) / mercyStudents.length;

  const namesHtml = mercyStudents.map((student) => `
    <li class="list-group-item d-flex justify-content-between gap-2">
      <span>${escapeHtml(student.name)}</span>
      <strong dir="ltr">${student.newAverage.toFixed(2)}</strong>
    </li>
  `).join("");

  reportBox.innerHTML = `
    <div class="report-grid">
      <div class="report-stat">
        عدد الطلاب المتعثرين
        <strong>${strugglingStudents.length}</strong>
      </div>
      <div class="report-stat">
        المتوسط العام بعد الرأفة
        <strong dir="ltr">${generalAverage.toFixed(2)}</strong>
      </div>
    </div>
    <h3 class="h6 mt-3 mb-2">أسماء الطلاب المعدلة</h3>
    <ul class="list-group list-group-flush mercy-list">
      ${namesHtml}
    </ul>
  `;
});

renderStudents();
