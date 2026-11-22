export function createMercyReport(students) {
  const eligibleStudents = students
    .filter((student) => student.getAverage() >= 40 && student.getAverage() <= 49)
    .map((student) => ({
      name: student.name,
      averageAfterMercy: student.getAverage() + 5
    }));

  const averageAfterMercy = eligibleStudents.length === 0
    ? null
    : eligibleStudents.reduce((total, student) => total + student.averageAfterMercy, 0) / eligibleStudents.length;

  return { students: eligibleStudents, averageAfterMercy };
}

export function serializeBackup(students, exportedAt = new Date()) {
  return JSON.stringify({
    version: 1,
    exportedAt: exportedAt.toISOString(),
    students: students.map((student) => ({
      name: student.name,
      grade1: student.grade1,
      grade2: student.grade2,
      grade3: student.grade3,
      attendance: student.attendance
    }))
  }, null, 2);
}

export function parseBackup(contents) {
  let backup;
  try {
    backup = JSON.parse(contents);
  } catch (_error) {
    throw new Error("ملف النسخة الاحتياطية ليس بصيغة JSON صحيحة.");
  }

  if (!backup || backup.version !== 1 || !Array.isArray(backup.students)) {
    throw new Error("صيغة النسخة الاحتياطية غير مدعومة.");
  }

  return backup.students.map((record, index) => {
    try {
      if (!record || typeof record !== "object" || Array.isArray(record)) {
        throw new Error("بيانات الطالب غير صالحة.");
      }
      const requiredFields = ["name", "grade1", "grade2", "grade3", "attendance"];
      if (!requiredFields.every((field) => Object.prototype.hasOwnProperty.call(record, field))) {
        throw new Error("بيانات الطالب غير مكتملة.");
      }

      return record;
    } catch (error) {
      throw new Error(`بيانات الطالب رقم ${index + 1} غير صالحة: ${error.message}`);
    }
  });
}
