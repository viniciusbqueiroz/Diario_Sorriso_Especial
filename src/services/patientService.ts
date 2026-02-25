import { API_BASE_URL } from "../config/api";
import {
  BackendRecord,
  Patient,
  PatientClinicalProfile,
  PatientSex,
  ToothRecord,
} from "../types/app";

export async function loadPatients(): Promise<Patient[]> {
  const response = await fetch(`${API_BASE_URL}/patients`);
  if (!response.ok) {
    throw new Error("Falha ao buscar pacientes.");
  }

  const data = (await response.json()) as Patient[];
  return data.filter(
    (patient) =>
      typeof patient?.id === "string" &&
      patient.id.trim().length > 0 &&
      typeof patient?.name === "string" &&
      patient.name.trim().length > 0,
  );
}

export async function fetchRecords(
  patientId: string,
  date?: string,
): Promise<BackendRecord[]> {
  const safePatientId = encodeURIComponent(patientId);
  const searchParams = new URLSearchParams();

  if (date) {
    searchParams.set("date", date);
  }

  const query = searchParams.toString();
  const response = await fetch(
    `${API_BASE_URL}/patients/${safePatientId}/records${query ? `?${query}` : ""}`,
  );

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error("Falha ao carregar registros.");
  }

  const records = (await response.json()) as BackendRecord[];
  return Array.isArray(records) ? records : [];
}

export async function createPatient(payload: {
  name: string;
  sex?: PatientSex;
  motherName?: string;
  birthDate?: string;
  notes?: string;
  clinicalProfile?: PatientClinicalProfile;
}): Promise<Patient> {
  const response = await fetch(`${API_BASE_URL}/patients`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Falha ao cadastrar paciente");
  }

  return (await response.json()) as Patient;
}

export async function removePatient(patientId: string): Promise<void> {
  const safePatientId = encodeURIComponent(patientId.trim());

  const response = await fetch(`${API_BASE_URL}/patients/${safePatientId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    let message = "Não foi possível apagar o paciente.";
    try {
      const error = (await response.json()) as { message?: string };
      if (error?.message) {
        message = error.message;
      }
    } catch {
      try {
        const rawText = await response.text();
        if (rawText.includes("Cannot DELETE")) {
          message =
            "Backend sem rota de exclusão ativa. Reinicie o backend e tente novamente.";
        }
      } catch {
        // mantém mensagem padrão
      }
    }

    if (
      response.status === 404 &&
      message === "Não foi possível apagar o paciente."
    ) {
      message = "Paciente não encontrado.";
    }

    throw new Error(message);
  }
}

export async function createRecord(
  patientId: string,
  payload: {
    date: string;
    brushed: boolean;
    fear: boolean;
    sleptWell: boolean;
    ateTooMuchCandy: boolean;
    mood: string;
    triggers: string[];
    odontogram?: ToothRecord[];
    photoDataUrl?: string;
  },
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/patients/${patientId}/records`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    let backendMessage = "";

    try {
      const data = (await response.json()) as { message?: string };
      if (typeof data?.message === "string") {
        backendMessage = data.message;
      }
    } catch {
      backendMessage = "";
    }

    if (response.status === 413) {
      throw new Error("Foto muito grande para envio. Tente outra foto.");
    }

    throw new Error(backendMessage || "Falha ao salvar registro");
  }
}

export async function removeToothFromRecord(
  patientId: string,
  date: string,
  toothNumber: number,
): Promise<void> {
  const safePatientId = encodeURIComponent(patientId.trim());
  const safeDate = encodeURIComponent(date.trim());
  const safeToothNumber = encodeURIComponent(String(toothNumber));

  const response = await fetch(
    `${API_BASE_URL}/patients/${safePatientId}/records/${safeDate}/odontogram/${safeToothNumber}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    let message = "Não foi possível excluir o dente do odontograma.";
    try {
      const error = (await response.json()) as { message?: string };
      if (error?.message) {
        message = error.message;
      }
    } catch {
      // mantém mensagem padrão
    }

    throw new Error(message);
  }
}

export async function checkHealth(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error("Health check falhou");
  }
}
