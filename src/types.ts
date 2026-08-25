export interface DailyEntry {
  id: string;
  date: string;
  sleepQuality: number | null;
  mood: number | null;
  energy: number | null;
  symptoms: string | null;
  actions: string | null;
}

export interface WeeklyNote {
  id: string;
  weekStart: string;
  mainSymptom: string | null;
  pattern: string | null;
}

export interface DoctorVisit {
  id: string;
  appointmentDate: string | null;
  clinician: string | null;
  chapter: string | null;
  symptom1: string | null;
  symptom2: string | null;
  symptom3: string | null;
  timingPattern: string | null;
  script: string | null;
  questions: string | null;
  decisions: string | null;
}

export interface LabResult {
  id: string;
  test: string;
  result: string | null;
  referenceRange: string | null;
  date: string | null;
  note: string | null;
}
