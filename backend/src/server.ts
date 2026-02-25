import cors from "cors";
import express, { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { readDb, writeDb } from "./store.js";
import {
  DailyRecord,
  MedicationInUse,
  Mood,
  PatientClinicalProfile,
  PatientSex,
  Trigger,
} from "./types.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3333);

const moodCooperationScore: Record<Mood, number> = {
  muito_bom: 100,
  bom: 75,
  neutro: 50,
  triste: 25,
};

function getRouteParam(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (
    Array.isArray(value) &&
    value.length > 0 &&
    typeof value[0] === "string" &&
    value[0].trim().length > 0
  ) {
    return value[0];
  }

  return null;
}

function getDateQueryParam(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (
    Array.isArray(value) &&
    value.length > 0 &&
    typeof value[0] === "string" &&
    value[0].trim().length > 0
  ) {
    return value[0];
  }

  return null;
}

function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function asTrimmedString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function asBinaryAnswer(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  return null;
}

function asMedications(value: unknown): MedicationInUse[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === "object" && item !== null)
    .map((item) => {
      const data = item as Record<string, unknown>;
      return {
        medication: asTrimmedString(data.medication) ?? "",
        dosage: asTrimmedString(data.dosage) ?? "",
        schedule: asTrimmedString(data.schedule) ?? "",
        indication: asTrimmedString(data.indication) ?? "",
      };
    })
    .filter(
      (item) =>
        item.medication || item.dosage || item.schedule || item.indication,
    );
}

function sanitizeClinicalProfile(
  value: unknown,
): PatientClinicalProfile | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const profile = value as Record<string, unknown>;
  const sanitized: PatientClinicalProfile = {
    mainDiagnosis: asTrimmedString(profile.mainDiagnosis),
    cid: asTrimmedString(profile.cid),
    diagnosisAge: asTrimmedString(profile.diagnosisAge),
    responsibleDoctor: asTrimmedString(profile.responsibleDoctor),
    medicalSpecialties: asStringArray(profile.medicalSpecialties),
    medicalSpecialtyOther: asTrimmedString(profile.medicalSpecialtyOther),
    systemicConditions: asStringArray(profile.systemicConditions),
    systemicConditionOther: asTrimmedString(profile.systemicConditionOther),
    hadSeizures: asBinaryAnswer(profile.hadSeizures),
    lastSeizure: asTrimmedString(profile.lastSeizure),
    seizureFrequency: asTrimmedString(profile.seizureFrequency),
    hasBehavioralCrises: asBinaryAnswer(profile.hasBehavioralCrises),
    behavioralTriggers: asTrimmedString(profile.behavioralTriggers),
    hadHospitalization: asBinaryAnswer(profile.hadHospitalization),
    hospitalizationReason: asTrimmedString(profile.hospitalizationReason),
    hadGeneralAnesthesia: asBinaryAnswer(profile.hadGeneralAnesthesia),
    medicationsInUse: asMedications(profile.medicationsInUse),
    usesAnticoagulants: asBinaryAnswer(profile.usesAnticoagulants),
    usesAnticonvulsants: asBinaryAnswer(profile.usesAnticonvulsants),
    usesPsychotropics: asBinaryAnswer(profile.usesPsychotropics),
    usesCorticosteroids: asBinaryAnswer(profile.usesCorticosteroids),
  };

  const hasContent =
    Boolean(sanitized.mainDiagnosis) ||
    Boolean(sanitized.cid) ||
    Boolean(sanitized.diagnosisAge) ||
    Boolean(sanitized.responsibleDoctor) ||
    sanitized.medicalSpecialties.length > 0 ||
    Boolean(sanitized.medicalSpecialtyOther) ||
    sanitized.systemicConditions.length > 0 ||
    Boolean(sanitized.systemicConditionOther) ||
    sanitized.hadSeizures !== null ||
    Boolean(sanitized.lastSeizure) ||
    Boolean(sanitized.seizureFrequency) ||
    sanitized.hasBehavioralCrises !== null ||
    Boolean(sanitized.behavioralTriggers) ||
    sanitized.hadHospitalization !== null ||
    Boolean(sanitized.hospitalizationReason) ||
    sanitized.hadGeneralAnesthesia !== null ||
    sanitized.medicationsInUse.length > 0 ||
    sanitized.usesAnticoagulants !== null ||
    sanitized.usesAnticonvulsants !== null ||
    sanitized.usesPsychotropics !== null ||
    sanitized.usesCorticosteroids !== null;

  return hasContent ? sanitized : undefined;
}

function buildReport(records: DailyRecord[]) {
  if (records.length === 0) {
    return {
      totalRecords: 0,
      brushingFrequency: 0,
      anxietyEpisodes: 0,
      cooperationAverage: 0,
      unhealthyFoodFrequency: 0,
      sleepQualityFrequency: 0,
      triggerCounts: {},
      period: null,
    };
  }

  const brushedCount = records.filter((record) => record.brushed).length;
  const fearCount = records.filter((record) => record.fear).length;
  const candyCount = records.filter((record) => record.ateTooMuchCandy).length;
  const sleptWellCount = records.filter((record) => record.sleptWell).length;

  const cooperationAverage = Math.round(
    records.reduce(
      (sum, record) => sum + moodCooperationScore[record.mood],
      0,
    ) / records.length,
  );

  const triggerCounts = records.reduce<Record<string, number>>(
    (acc, record) => {
      record.triggers.forEach((trigger) => {
        acc[trigger] = (acc[trigger] ?? 0) + 1;
      });
      return acc;
    },
    {},
  );

  const orderedDates = records
    .map((record) => record.date)
    .sort((a, b) => a.localeCompare(b));

  return {
    totalRecords: records.length,
    brushingFrequency: Math.round((brushedCount / records.length) * 100),
    anxietyEpisodes: fearCount,
    cooperationAverage,
    unhealthyFoodFrequency: Math.round((candyCount / records.length) * 100),
    sleepQualityFrequency: Math.round((sleptWellCount / records.length) * 100),
    triggerCounts,
    period: {
      start: orderedDates[0],
      end: orderedDates[orderedDates.length - 1],
    },
  };
}

app.use(cors());
app.use(express.json({ limit: "8mb" }));

app.get("/api", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: "diario-sorriso-backend",
    message: "API online. Use /health para status.",
  });
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true, service: "diario-sorriso-backend" });
});

app.post("/api/patients", async (req: Request, res: Response) => {
  const { name, sex, motherName, birthDate, notes, clinicalProfile } =
    req.body ?? {};
  const validSexes: PatientSex[] = ["feminino", "masculino", "outro"];

  if (!name || typeof name !== "string") {
    return res.status(400).json({ message: "Campo 'name' é obrigatório." });
  }

  if (sex !== undefined && !validSexes.includes(sex)) {
    return res.status(400).json({ message: "Campo 'sex' inválido." });
  }

  const db = await readDb();
  const patient = {
    id: randomUUID(),
    name: name.trim(),
    sex: validSexes.includes(sex) ? sex : undefined,
    motherName: typeof motherName === "string" ? motherName.trim() : undefined,
    birthDate: typeof birthDate === "string" ? birthDate : undefined,
    notes: typeof notes === "string" ? notes.trim() : undefined,
    clinicalProfile: sanitizeClinicalProfile(clinicalProfile),
    createdAt: new Date().toISOString(),
  };

  db.patients.push(patient);
  await writeDb(db);

  return res.status(201).json(patient);
});

app.get("/api/patients", async (_req: Request, res: Response) => {
  const db = await readDb();
  res.json(db.patients);
});

app.get("/api/patients/:id", async (req: Request, res: Response) => {
  const patientId = getRouteParam(req.params.id);
  if (!patientId) {
    return res.status(400).json({ message: "Parâmetro de paciente inválido." });
  }

  const db = await readDb();
  const patient = db.patients.find((item) => item.id === patientId);

  if (!patient) {
    return res.status(404).json({ message: "Paciente não encontrado." });
  }

  return res.json(patient);
});

app.delete("/patients/:id", async (req: Request, res: Response) => {
  const patientId = getRouteParam(req.params.id);
  if (!patientId) {
    return res.status(400).json({ message: "Parâmetro de paciente inválido." });
  }

  const db = await readDb();
  const patientIndex = db.patients.findIndex((item) => item.id === patientId);

  if (patientIndex < 0) {
    return res.status(404).json({ message: "Paciente não encontrado." });
  }

  const removedPatient = db.patients[patientIndex];
  db.patients.splice(patientIndex, 1);
  db.records = db.records.filter((record) => record.patientId !== patientId);
  await writeDb(db);

  return res.json({
    message: "Paciente removido com sucesso.",
    patient: removedPatient,
  });
});

app.post("/patients/:id/records", async (req: Request, res: Response) => {
  try {
    const patientId = getRouteParam(req.params.id);
    if (!patientId) {
      console.error("Parâmetro de paciente inválido", req.params.id);
      return res
        .status(400)
        .json({ message: "Parâmetro de paciente inválido." });
    }

    const db = await readDb();

    const patientExists = db.patients.some(
      (patient) => patient.id === patientId,
    );
    if (!patientExists) {
      console.error("Paciente não encontrado", patientId);
      return res.status(404).json({ message: "Paciente não encontrado." });
    }

    const {
      date,
      brushed,
      fear,
      sleptWell,
      ateTooMuchCandy,
      mood,
      triggers,
      odontogram,
      photoDataUrl,
    } = req.body ?? {};

    const validMoods: Mood[] = ["muito_bom", "bom", "neutro", "triste"];
    const validTriggers: Trigger[] = ["barulho", "luz", "cheiro", "toque"];
    const validSensitivity = ["nenhuma", "leve", "moderada", "alta"];

    // Se fornecido, validar mood
    if (mood !== undefined && !validMoods.includes(mood)) {
      console.error("Campo 'mood' inválido", mood);
      return res.status(400).json({ message: "Campo 'mood' inválido." });
    }

    // Se fornecido, validar triggers
    if (triggers !== undefined) {
      if (!Array.isArray(triggers)) {
        console.error("Campo 'triggers' inválido (não é array)", triggers);
        return res.status(400).json({ message: "Campo 'triggers' inválido." });
      }
      // Se não for vazio, validar conteúdo
      if (
        triggers.length > 0 &&
        triggers.some((trigger) => !validTriggers.includes(trigger))
      ) {
        console.error("Campo 'triggers' inválido (valor)", triggers);
        return res.status(400).json({ message: "Campo 'triggers' inválido." });
      }
    }

    if (odontogram !== undefined) {
      if (!Array.isArray(odontogram)) {
        console.error("Campo 'odontogram' inválido (não é array)", odontogram);
        return res
          .status(400)
          .json({ message: "Campo 'odontogram' inválido." });
      }
      // Se não for vazio, validar conteúdo
      if (odontogram.length > 0) {
        const hasInvalidToothRecord = odontogram.some((item) => {
          if (typeof item !== "object" || item === null) {
            return true;
          }

          const toothNumber = (item as { toothNumber?: unknown }).toothNumber;
          const hasCaries = (item as { hasCaries?: unknown }).hasCaries;
          const hasTooth = (item as { hasTooth?: unknown }).hasTooth;
          const hasPain = (item as { hasPain?: unknown }).hasPain;
          const sensitivity = (item as { sensitivity?: unknown }).sensitivity;
          const notes = (item as { notes?: unknown }).notes;

          return (
            typeof toothNumber !== "number" ||
            !Number.isInteger(toothNumber) ||
            toothNumber < 1 ||
            toothNumber > 32 ||
            typeof hasCaries !== "boolean" ||
            typeof hasTooth !== "boolean" ||
            typeof hasPain !== "boolean" ||
            typeof sensitivity !== "string" ||
            !validSensitivity.includes(sensitivity) ||
            (notes !== undefined && typeof notes !== "string")
          );
        });

        if (hasInvalidToothRecord) {
          console.error("Campo 'odontogram' inválido (item)", odontogram);
          return res
            .status(400)
            .json({ message: "Campo 'odontogram' inválido." });
        }
      }
    }

    if (photoDataUrl !== undefined) {
      if (
        typeof photoDataUrl !== "string" ||
        photoDataUrl.trim().length === 0
      ) {
        console.error("Campo 'photoDataUrl' inválido", photoDataUrl);
        return res
          .status(400)
          .json({ message: "Campo 'photoDataUrl' inválido." });
      }

      if (!photoDataUrl.startsWith("data:image/")) {
        console.error(
          "Campo 'photoDataUrl' deve ser imagem em data URL",
          photoDataUrl,
        );
        return res.status(400).json({
          message: "Campo 'photoDataUrl' deve ser imagem em data URL.",
        });
      }
    }

    const record: DailyRecord = {
      id: randomUUID(),
      patientId,
      date,
      brushed: Boolean(brushed),
      fear: Boolean(fear),
      sleptWell: Boolean(sleptWell),
      ateTooMuchCandy: Boolean(ateTooMuchCandy),
      mood,
      triggers,
      odontogram: Array.isArray(odontogram)
        ? odontogram.map((item) => ({
            toothNumber: item.toothNumber,
            hasCaries: item.hasCaries,
            hasTooth: item.hasTooth,
            hasPain: item.hasPain,
            sensitivity: item.sensitivity,
            notes:
              typeof item.notes === "string"
                ? item.notes.trim() || undefined
                : undefined,
          }))
        : undefined,
      photoDataUrl:
        typeof photoDataUrl === "string" ? photoDataUrl.trim() : undefined,
      createdAt: new Date().toISOString(),
    };

    // Log do registro antes de salvar
    console.log("Salvando registro:", record);

    db.records.push(record);
    await writeDb(db);

    console.log("Registro salvo com sucesso");
    return res.status(201).json(record);
  } catch (err) {
    console.error("Erro inesperado ao salvar registro:", err);
    return res.status(500).json({
      message: "Erro inesperado ao salvar registro.",
      error: String(err),
    });
  }
});

app.delete(
  "/patients/:id/records/:date/odontogram/:toothNumber",
  async (req: Request, res: Response) => {
    const patientId = getRouteParam(req.params.id);
    const recordDate = getRouteParam(req.params.date);
    const toothNumberParam = getRouteParam(req.params.toothNumber);

    if (!patientId || !recordDate || !toothNumberParam) {
      return res
        .status(400)
        .json({ message: "Parâmetros para exclusão do dente inválidos." });
    }

    if (!isValidIsoDate(recordDate)) {
      return res.status(400).json({ message: "Parâmetro 'date' inválido." });
    }

    const toothNumber = Number(toothNumberParam);
    if (!Number.isInteger(toothNumber) || toothNumber < 1 || toothNumber > 32) {
      return res
        .status(400)
        .json({ message: "Parâmetro 'toothNumber' inválido." });
    }

    const db = await readDb();
    const patientExists = db.patients.some(
      (patient) => patient.id === patientId,
    );
    if (!patientExists) {
      return res.status(404).json({ message: "Paciente não encontrado." });
    }

    const recordsForDate = db.records.filter(
      (record) => record.patientId === patientId && record.date === recordDate,
    );

    if (recordsForDate.length === 0) {
      return res
        .status(404)
        .json({ message: "Registro diário não encontrado." });
    }

    let removedCount = 0;

    recordsForDate.forEach((record) => {
      const currentOdontogram = record.odontogram ?? [];
      const nextOdontogram = currentOdontogram.filter(
        (item) => item.toothNumber !== toothNumber,
      );

      if (nextOdontogram.length !== currentOdontogram.length) {
        removedCount += 1;
        record.odontogram =
          nextOdontogram.length > 0 ? nextOdontogram : undefined;
      }
    });

    if (removedCount === 0) {
      return res
        .status(404)
        .json({ message: "Dente não encontrado no registro." });
    }

    await writeDb(db);

    return res.json({
      date: recordDate,
      patientId,
      toothNumber,
      updatedRecords: removedCount,
    });
  },
);

app.get("/reports/:patientId", async (req: Request, res: Response) => {
  const patientId = getRouteParam(req.params.patientId);
  if (!patientId) {
    return res.status(400).json({ message: "Parâmetro de paciente inválido." });
  }

  const db = await readDb();
  const date = getDateQueryParam(req.query.date);

  if (date && !isValidIsoDate(date)) {
    return res.status(400).json({ message: "Query param 'date' inválido." });
  }

  const patient = db.patients.find((item) => item.id === patientId);
  if (!patient) {
    return res.status(404).json({ message: "Paciente não encontrado." });
  }

  const records = db.records.filter(
    (record) =>
      record.patientId === patientId && (!date || record.date === date),
  );

  const report = buildReport(records);

  return res.json({
    patient,
    scope: date ? "daily" : "general",
    filterDate: date,
    ...report,
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend rodando em http://localhost:${PORT}`);
  });
}

export default app;
