import assert from "node:assert/strict";
import test from "node:test";
import { Student } from "../js/main.js";
import { createMercyReport, parseBackup, serializeBackup } from "../js/student.js";
import { LocalStudentRepository } from "../js/studentRepository.js";

function makeStudent(name, grade1, grade2, grade3, attendance = 90) {
  return new Student(name, grade1, grade2, grade3, attendance);
}

test("validates and calculates a student's average", () => {
  const student = makeStudent("  سامي  ", 40, 50, 60);

  assert.equal(student.name, "سامي");
  assert.equal(student.getAverage(), 50);
  assert.equal(student.attendance, 90);
});

test("rejects missing and out-of-range values", () => {
  assert.throws(() => makeStudent("سامي", "", 50, 60), /يرجى إدخال المادة الأولى/);
  assert.throws(() => makeStudent("سامي", 101, 50, 60), /بين 0 و 100/);
  assert.throws(() => makeStudent(" ", 40, 50, 60), /اسم الطالب/);
});

test("validates grade and attendance updates through setters", () => {
  const student = makeStudent("سامي", 40, 50, 60);

  assert.throws(() => {
    student.grade1 = -1;
  }, /بين 0 و 100/);
  assert.throws(() => {
    student.attendance = "";
  }, /يرجى إدخال نسبة الحضور/);
  assert.equal(student.grade1, 40);
  assert.equal(student.attendance, 90);
});

test("includes only students with averages from 40 through 49 in mercy reports", () => {
  const report = createMercyReport([
    makeStudent("حد أدنى", 40, 40, 40),
    makeStudent("حد أعلى", 49, 49, 49),
    makeStudent("أقل من النطاق", 39, 39, 39),
    makeStudent("أعلى من النطاق", 50, 50, 50)
  ]);

  assert.deepEqual(report.students.map((student) => student.name), ["حد أدنى", "حد أعلى"]);
  assert.equal(report.averageAfterMercy, 49.5);
});

test("round-trips a versioned backup", () => {
  const students = [makeStudent("سارة", 42, 44, 46, 95)];
  const contents = serializeBackup(students, new Date("2026-01-01T00:00:00.000Z"));
  const [record] = parseBackup(contents);
  const restored = makeStudent(record.name, record.grade1, record.grade2, record.grade3, record.attendance);

  assert.equal(restored.name, "سارة");
  assert.equal(restored.getAverage(), 44);
  assert.deepEqual(parseBackup(serializeBackup([])), []);
});

test("rejects malformed or unsupported backups without returning partial records", () => {
  assert.throws(() => parseBackup("{"), /JSON صحيحة/);
  assert.throws(() => parseBackup('{"version":2,"students":[]}'), /غير مدعومة/);
  assert.throws(() => parseBackup('{"version":1,"students":[{"name":"صالح","grade1":20}]}'), /غير مكتملة/);
});

test("loads and saves student records through the local repository", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
  const repository = new LocalStudentRepository(storage);

  repository.save([makeStudent("منى", 80, 90, 100, 88)]);
  const restored = repository.load();

  assert.equal(restored.length, 1);
  assert.equal(restored[0].name, "منى");
  assert.equal(restored[0].attendance, 88);
});

test("reports corrupt saved records instead of silently discarding them", () => {
  const storage = {
    getItem: () => "{invalid",
    setItem: () => {}
  };
  const repository = new LocalStudentRepository(storage);

  assert.throws(() => repository.load(), /تعذر قراءة بيانات الطلاب/);
});
