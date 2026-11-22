import { createMercyReport, parseBackup, serializeBackup } from "./student.js";
import { LocalStudentRepository } from "./studentRepository.js";

function validatePercentage(fieldName, value) {
  if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) {
    throw new Error(`يرجى إدخال ${fieldName}.`);
  }

  if (typeof value !== "string" && typeof value !== "number") {
    throw new Error(`يجب أن تكون درجة ${fieldName} رقماً.`);
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

export class Student {
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

  set grade1(value) {
    this.#grade1 = validatePercentage("المادة الأولى", value);
  }

  get grade1() {
    return this.#grade1;
  }

  set grade2(value) {
    this.#grade2 = validatePercentage("المادة الثانية", value);
  }

  get grade2() {
    return this.#grade2;
  }

  set grade3(value) {
    this.#grade3 = validatePercentage("المادة الثالثة", value);
  }

  get grade3() {
    return this.#grade3;
  }

  set attendance(value) {
    this.#attendance = validatePercentage("نسبة الحضور", value);
  }

  get attendance() {
    return this.#attendance;
  }

  getAverage() {
    return (this.#grade1 + this.#grade2 + this.#grade3) / 3;
  }
}

function initializeApp() {
  const studentsList = [];
  let repository;

  const studentForm = document.getElementById("studentForm");
  const studentNameInput = document.getElementById("studentName");
  const grade1Input = document.getElementById("grade1");
  const grade2Input = document.getElementById("grade2");
  const grade3Input = document.getElementById("grade3");
  const attendanceInput = document.getElementById("attendance");
  const mercyBtn = document.getElementById("mercyBtn");
  const errorBox = document.getElementById("errorBox");
  const successBox = document.getElementById("successBox");
  const studentsListBox = document.getElementById("studentsList");
  const studentCount = document.getElementById("studentCount");
  const reportBox = document.getElementById("reportBox");
  const clearStudentsBtn = document.getElementById("clearStudentsBtn");
  const exportBackupBtn = document.getElementById("exportBackupBtn");
  const importBackupBtn = document.getElementById("importBackupBtn");
  const backupFileInput = document.getElementById("backupFileInput");
  const storageStatus = document.getElementById("storageStatus");
  let canImportBackup = false;

  function saveStudents(nextStudents) {
    repository.save(nextStudents);
    studentsList.splice(0, studentsList.length, ...nextStudents);
  }

  function resetReport() {
    reportBox.innerHTML = '<p class="empty-state mb-0">فعّل لجنة الرأفة لإنشاء التقرير.</p>';
  }

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
          <button type="button" class="btn btn-delete" data-index="${index}" aria-label="حذف الطالب">
            <i class="bi bi-trash3"></i>
          </button>
        </div>
      `).join("");
    }

    studentCount.textContent = `${studentsList.length} ${studentsList.length === 1 ? "طالب" : "طلاب"}`;
    clearStudentsBtn.disabled = studentsList.length === 0;
    exportBackupBtn.disabled = studentsList.length === 0;
  }

  function restoreStudent(record, index) {
    try {
      if (!record || typeof record !== "object" || Array.isArray(record)) {
        throw new Error("بيانات الطالب غير صالحة.");
      }

      return new Student(record.name, record.grade1, record.grade2, record.grade3, record.attendance);
    } catch (error) {
      throw new Error(`بيانات الطالب رقم ${index + 1} غير صالحة: ${error.message}`);
    }
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

      saveStudents([...studentsList, student]);
      renderStudents();
      resetReport();
      studentForm.reset();
      showSuccess(`تمت إضافة الطالب ${student.name} بنجاح.`);
      studentNameInput.focus();
    } catch (error) {
      showError(error.message);
    }
  });

  studentsListBox.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-index]");
    if (!deleteButton) {
      return;
    }

    const index = Number(deleteButton.dataset.index);
    if (!Number.isInteger(index) || !studentsList[index]) {
      return;
    }

    const removedName = studentsList[index].name;
    try {
      saveStudents(studentsList.filter((_student, studentIndex) => studentIndex !== index));
      renderStudents();
      resetReport();
      showSuccess(`تم حذف الطالب ${removedName}.`);
    } catch (error) {
      showError(`تعذر حفظ التغيير: ${error.message}`);
    }
  });

  clearStudentsBtn.addEventListener("click", () => {
    if (studentsList.length === 0) {
      return;
    }

    if (!window.confirm("هل تريد مسح جميع الطلاب؟")) {
      return;
    }

    try {
      saveStudents([]);
      renderStudents();
      resetReport();
      showSuccess("تم مسح جميع بيانات الطلاب.");
    } catch (error) {
      showError(`تعذر حفظ التغيير: ${error.message}`);
    }
  });

  exportBackupBtn.addEventListener("click", () => {
    const backup = new Blob([serializeBackup(studentsList)], { type: "application/json" });
    const downloadUrl = URL.createObjectURL(backup);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `grades-management-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    showSuccess("تم تنزيل النسخة الاحتياطية.");
  });

  importBackupBtn.addEventListener("click", () => backupFileInput.click());

  backupFileInput.addEventListener("change", async () => {
    const file = backupFileInput.files[0];
    if (!file) {
      return;
    }

    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("حجم ملف النسخة الاحتياطية يجب ألا يتجاوز 5 ميغابايت.");
      }

      const importedStudents = parseBackup(await file.text()).map(restoreStudent);
      if (!window.confirm(`سيتم استبدال قائمة الطلاب الحالية بـ ${importedStudents.length} طالب. هل تريد المتابعة؟`)) {
        return;
      }

      saveStudents(importedStudents);
      renderStudents();
      resetReport();
      showSuccess(`تم استيراد ${importedStudents.length} طالب بنجاح.`);
    } catch (error) {
      showError(`تعذر استيراد النسخة الاحتياطية: ${error.message}`);
    } finally {
      backupFileInput.value = "";
    }
  });

  mercyBtn.addEventListener("click", () => {
    const report = createMercyReport(studentsList);
    if (report.students.length === 0) {
      reportBox.innerHTML = `
        <div class="report-grid">
          <div class="report-stat">
            عدد الطلاب المتعثرين
            <strong>0</strong>
          </div>
          <div class="report-stat">
            متوسط المستفيدين بعد الرأفة
            <strong>غير متاح</strong>
          </div>
        </div>
        <p class="empty-state mt-3 mb-0">لا يوجد طلاب متعثرون حاليًا.</p>
      `;
      return;
    }

    const namesHtml = report.students.map((student) => `
      <li class="list-group-item d-flex justify-content-between gap-2">
        <span>${escapeHtml(student.name)}</span>
        <strong dir="ltr">${student.averageAfterMercy.toFixed(2)}</strong>
      </li>
    `).join("");

    reportBox.innerHTML = `
      <div class="report-grid">
        <div class="report-stat">
          عدد الطلاب المتعثرين
          <strong>${report.students.length}</strong>
        </div>
        <div class="report-stat">
          متوسط المستفيدين بعد الرأفة
          <strong dir="ltr">${report.averageAfterMercy.toFixed(2)}</strong>
        </div>
      </div>
      <h3 class="h6 mt-3 mb-2">أسماء الطلاب المعدلة</h3>
      <ul class="list-group list-group-flush mercy-list">
        ${namesHtml}
      </ul>
    `;
  });

  try {
    repository = new LocalStudentRepository();
    canImportBackup = true;
    studentsList.push(...repository.load().map(restoreStudent));
  } catch (error) {
    storageStatus.textContent = "تعذر الوصول إلى البيانات";
    storageStatus.closest(".status-badge").classList.add("status-error");
    showError(`تعذر تحميل بيانات الطلاب: ${error.message}`);
    studentForm.querySelectorAll("input, button").forEach((control) => {
      control.disabled = true;
    });
    [mercyBtn, clearStudentsBtn, exportBackupBtn].forEach((control) => {
      control.disabled = true;
    });
    importBackupBtn.disabled = !canImportBackup;
    backupFileInput.disabled = !canImportBackup;
  }

  renderStudents();
}

if (typeof document !== "undefined") {
  initializeApp();
}
