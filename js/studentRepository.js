const STORAGE_KEY = "grades-management-students";

export class LocalStudentRepository {
  constructor(storage = globalThis.localStorage) {
    if (!storage) {
      throw new Error("التخزين المحلي غير متاح في هذا المتصفح.");
    }

    this.storage = storage;
  }

  load() {
    const savedRecords = this.storage.getItem(STORAGE_KEY);
    if (savedRecords === null) {
      return [];
    }

    let records;
    try {
      records = JSON.parse(savedRecords);
    } catch (_error) {
      throw new Error("تعذر قراءة بيانات الطلاب المحفوظة؛ صدّر نسخة احتياطية قبل استبدالها.");
    }

    if (!Array.isArray(records)) {
      throw new Error("بيانات الطلاب المحفوظة لا تطابق الصيغة المتوقعة.");
    }

    return records;
  }

  save(students) {
    const records = students.map((student) => ({
      name: student.name,
      grade1: student.grade1,
      grade2: student.grade2,
      grade3: student.grade3,
      attendance: student.attendance
    }));

    this.storage.setItem(STORAGE_KEY, JSON.stringify(records));
  }
}
