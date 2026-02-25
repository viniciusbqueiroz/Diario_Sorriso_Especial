import { Mood, PatientSex, Step, Trigger } from "../types/app";

export const STORAGE_PATIENT_ID_KEY = "diario_sorriso_patient_id";

export const moodOptions: {
  id: Mood;
  emoji: string;
  label: string;
  coop: number;
}[] = [
  { id: "muito_bom", emoji: "😄", label: "Muito bom", coop: 100 },
  { id: "bom", emoji: "🙂", label: "Bom", coop: 75 },
  { id: "neutro", emoji: "😐", label: "Neutro", coop: 50 },
  { id: "triste", emoji: "😣", label: "Triste", coop: 25 },
];

export const stepItems: { id: Step; label: string }[] = [
  { id: "patient", label: "Paciente" },
  { id: "daily", label: "Diário" },
  { id: "odontogram", label: "Odontograma" },
  { id: "mood", label: "Humor" },
  { id: "progress", label: "Progresso" },
];

export const triggerOptions: {
  id: Trigger;
  emoji: string;
  label: string;
}[] = [
  { id: "barulho", emoji: "🔊", label: "Barulho" },
  { id: "luz", emoji: "💡", label: "Luz" },
  { id: "cheiro", emoji: "🌸", label: "Cheiro" },
  { id: "toque", emoji: "🤲", label: "Toque" },
];

export const patientSexOptions: {
  id: PatientSex;
  emoji: string;
  label: string;
}[] = [
  { id: "feminino", emoji: "👧", label: "Feminino" },
  { id: "masculino", emoji: "👦", label: "Masculino" },
  { id: "outro", emoji: "🧒", label: "Outro" },
];
