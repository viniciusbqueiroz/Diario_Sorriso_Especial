export type Mood = "muito_bom" | "bom" | "neutro" | "triste";
export type Trigger = "barulho" | "luz" | "cheiro" | "toque";
export type PatientSex = "feminino" | "masculino" | "outro";
export type ToothSensitivity = "nenhuma" | "leve" | "moderada" | "alta";
export type BinaryAnswer = boolean | null;

export type MedicationInUse = {
  medication: string;
  dosage: string;
  schedule: string;
  indication: string;
};

export type PatientClinicalProfile = {
  mainDiagnosis?: string;
  cid?: string;
  diagnosisAge?: string;
  responsibleDoctor?: string;
  medicalSpecialties: string[];
  medicalSpecialtyOther?: string;
  systemicConditions: string[];
  systemicConditionOther?: string;
  hadSeizures: BinaryAnswer;
  lastSeizure?: string;
  seizureFrequency?: string;
  hasBehavioralCrises: BinaryAnswer;
  behavioralTriggers?: string;
  hadHospitalization: BinaryAnswer;
  hospitalizationReason?: string;
  hadGeneralAnesthesia: BinaryAnswer;
  medicationsInUse: MedicationInUse[];
  usesAnticoagulants: BinaryAnswer;
  usesAnticonvulsants: BinaryAnswer;
  usesPsychotropics: BinaryAnswer;
  usesCorticosteroids: BinaryAnswer;
};

export type ToothRecord = {
  toothNumber: number;
  hasCaries: boolean;
  hasTooth: boolean;
  hasPain: boolean;
  sensitivity: ToothSensitivity;
  notes?: string;
};

export type Patient = {
  id: string;
  name: string;
  sex?: PatientSex;
  motherName?: string;
  birthDate?: string;
  notes?: string;
  clinicalProfile?: PatientClinicalProfile;
  createdAt: string;
};

export type DailyRecord = {
  id: string;
  patientId: string;
  date: string;
  brushed: boolean;
  fear: boolean;
  sleptWell: boolean;
  ateTooMuchCandy: boolean;
  mood: Mood;
  triggers: Trigger[];
  odontogram?: ToothRecord[];
  photoDataUrl?: string;
  createdAt: string;
};

export type DatabaseSchema = {
  patients: Patient[];
  records: DailyRecord[];
};
