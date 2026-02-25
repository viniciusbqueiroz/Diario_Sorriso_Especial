import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import { DateData } from "react-native-calendars";
import { Alert, SafeAreaView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { API_BASE_URL } from "./config/api";
import {
  STORAGE_PATIENT_ID_KEY,
  moodOptions,
  patientSexOptions,
  triggerOptions,
} from "./constants/app";
import { StepHeader } from "./components/StepHeader";
import { MoodStep } from "./screens/MoodStep";
import { OdontogramStep } from "./screens/OdontogramStep";
import { ProgressStep } from "./screens/ProgressStep";
import { appStyles as styles, themeColors } from "./styles/appStyles";
import {
  createPatient,
  createRecord,
  fetchRecords,
  loadPatients,
  removePatient,
  removeToothFromRecord,
  checkHealth,
} from "./services/patientService";
import { formatDateLabel, getTodayIso, isValidIsoDate } from "./utils/date";
import {
  BackendRecord,
  DailyEntry,
  MedicationInUse,
  Mood,
  Patient,
  PatientClinicalProfile,
  PatientSex,
  ProgressPhotoItem,
  Step,
  ToothRecord,
  Trigger,
} from "./types/app";
import { PatientStep } from "./screens/PatientStep";
import { AppRouter } from "./router/AppRouter";
import { DailyStep } from "./screens/DailyStep";

const createEmptyMedication = (): MedicationInUse => ({
  medication: "",
  dosage: "",
  schedule: "",
  indication: "",
});

const createInitialClinicalProfile = (): PatientClinicalProfile => ({
  mainDiagnosis: "",
  cid: "",
  diagnosisAge: "",
  responsibleDoctor: "",
  medicalSpecialties: [],
  medicalSpecialtyOther: "",
  systemicConditions: [],
  systemicConditionOther: "",
  hadSeizures: null,
  lastSeizure: "",
  seizureFrequency: "",
  hasBehavioralCrises: null,
  behavioralTriggers: "",
  hadHospitalization: null,
  hospitalizationReason: "",
  hadGeneralAnesthesia: null,
  medicationsInUse: [createEmptyMedication()],
  usesAnticoagulants: null,
  usesAnticonvulsants: null,
  usesPsychotropics: null,
  usesCorticosteroids: null,
});

const normalizeClinicalProfile = (
  profile: PatientClinicalProfile,
): PatientClinicalProfile | undefined => {
  const normalized: PatientClinicalProfile = {
    mainDiagnosis: profile.mainDiagnosis?.trim() || undefined,
    cid: profile.cid?.trim() || undefined,
    diagnosisAge: profile.diagnosisAge?.trim() || undefined,
    responsibleDoctor: profile.responsibleDoctor?.trim() || undefined,
    medicalSpecialties: profile.medicalSpecialties,
    medicalSpecialtyOther: profile.medicalSpecialtyOther?.trim() || undefined,
    systemicConditions: profile.systemicConditions,
    systemicConditionOther: profile.systemicConditionOther?.trim() || undefined,
    hadSeizures: profile.hadSeizures,
    lastSeizure: profile.lastSeizure?.trim() || undefined,
    seizureFrequency: profile.seizureFrequency?.trim() || undefined,
    hasBehavioralCrises: profile.hasBehavioralCrises,
    behavioralTriggers: profile.behavioralTriggers?.trim() || undefined,
    hadHospitalization: profile.hadHospitalization,
    hospitalizationReason: profile.hospitalizationReason?.trim() || undefined,
    hadGeneralAnesthesia: profile.hadGeneralAnesthesia,
    medicationsInUse: profile.medicationsInUse
      .map((item) => ({
        medication: item.medication.trim(),
        dosage: item.dosage.trim(),
        schedule: item.schedule.trim(),
        indication: item.indication.trim(),
      }))
      .filter(
        (item) =>
          item.medication || item.dosage || item.schedule || item.indication,
      ),
    usesAnticoagulants: profile.usesAnticoagulants,
    usesAnticonvulsants: profile.usesAnticonvulsants,
    usesPsychotropics: profile.usesPsychotropics,
    usesCorticosteroids: profile.usesCorticosteroids,
  };

  const hasContent =
    Boolean(normalized.mainDiagnosis) ||
    Boolean(normalized.cid) ||
    Boolean(normalized.diagnosisAge) ||
    Boolean(normalized.responsibleDoctor) ||
    normalized.medicalSpecialties.length > 0 ||
    Boolean(normalized.medicalSpecialtyOther) ||
    normalized.systemicConditions.length > 0 ||
    Boolean(normalized.systemicConditionOther) ||
    normalized.hadSeizures !== null ||
    Boolean(normalized.lastSeizure) ||
    Boolean(normalized.seizureFrequency) ||
    normalized.hasBehavioralCrises !== null ||
    Boolean(normalized.behavioralTriggers) ||
    normalized.hadHospitalization !== null ||
    Boolean(normalized.hospitalizationReason) ||
    normalized.hadGeneralAnesthesia !== null ||
    normalized.medicationsInUse.length > 0 ||
    normalized.usesAnticoagulants !== null ||
    normalized.usesAnticonvulsants !== null ||
    normalized.usesPsychotropics !== null ||
    normalized.usesCorticosteroids !== null;

  return hasContent ? normalized : undefined;
};

export default function App() {
  const [step, setStep] = useState<Step>("patient");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null,
  );

  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientSex, setNewPatientSex] = useState<PatientSex | null>(null);
  const [newPatientMotherName, setNewPatientMotherName] = useState("");
  const [newPatientBirthDate, setNewPatientBirthDate] = useState("");
  const [showBirthDateCalendar, setShowBirthDateCalendar] = useState(false);
  const [newPatientNotes, setNewPatientNotes] = useState("");
  const [newPatientClinicalProfile, setNewPatientClinicalProfile] =
    useState<PatientClinicalProfile>(createInitialClinicalProfile());

  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [brushed, setBrushed] = useState(false);
  const [fear, setFear] = useState(false);
  const [sleptWell, setSleptWell] = useState(false);
  const [ateTooMuchCandy, setAteTooMuchCandy] = useState(false);
  const [mood, setMood] = useState<Mood>("bom");
  const [selectedTriggers, setSelectedTriggers] = useState<Trigger[]>([]);
  const [odontogramRecords, setOdontogramRecords] = useState<ToothRecord[]>([]);
  const [odontogramPrefillLabel, setOdontogramPrefillLabel] = useState<
    string | null
  >(null);
  const [odontogramSourceDate, setOdontogramSourceDate] = useState<
    string | null
  >(null);
  const [selectedDate, setSelectedDate] = useState(getTodayIso());
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoPreviewUri, setPhotoPreviewUri] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showHistoryFilterModal, setShowHistoryFilterModal] = useState(false);
  const [showHistoryDateCalendar, setShowHistoryDateCalendar] = useState(false);
  const [historyDate, setHistoryDate] = useState(getTodayIso());
  const [historyFilterDate, setHistoryFilterDate] = useState<string | null>(
    null,
  );

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const todayIso = getTodayIso();

  const navigateStep = (nextStep: Step) => {
    setStep(nextStep);
  };

  useEffect(() => {
    initializeData();
  }, []);

  const resetPatientFormData = () => {
    setShowNewPatientForm(false);
    setShowBirthDateCalendar(false);
    setNewPatientName("");
    setNewPatientSex(null);
    setNewPatientMotherName("");
    setNewPatientBirthDate("");
    setNewPatientNotes("");
    setNewPatientClinicalProfile(createInitialClinicalProfile());
  };

  const resetDiaryFormData = () => {
    setBrushed(false);
    setFear(false);
    setSleptWell(false);
    setAteTooMuchCandy(false);
    setMood("bom");
    setSelectedTriggers([]);
    setOdontogramRecords([]);
    setOdontogramPrefillLabel(null);
    setOdontogramSourceDate(null);
    setSelectedDate(todayIso);
    setPhotoDataUrl(null);
    setPhotoPreviewUri(null);
    setShowCalendar(false);
  };

  useEffect(() => {
    if (step !== "patient") {
      return;
    }

    resetPatientFormData();
    resetDiaryFormData();
  }, [step]);

  const filteredEntries = useMemo(() => {
    if (!historyFilterDate) {
      return entries;
    }

    return entries.filter((entry) => entry.date === historyFilterDate);
  }, [entries, historyFilterDate]);

  const progress = useMemo(() => {
    if (filteredEntries.length === 0) {
      return {
        brushingFrequency: 0,
        anxietyEpisodes: 0,
        cooperationEvolution: 0,
        unhealthyFoodFrequency: 0,
      };
    }

    const brushedCount = filteredEntries.filter(
      (entry) => entry.brushed,
    ).length;
    const fearCount = filteredEntries.filter((entry) => entry.fear).length;
    const candyCount = filteredEntries.filter(
      (entry) => entry.ateTooMuchCandy,
    ).length;

    const cooperationTotal = filteredEntries.reduce((sum, entry) => {
      const option = moodOptions.find((item) => item.id === entry.mood);
      return sum + (option?.coop ?? 0);
    }, 0);

    return {
      brushingFrequency: Math.round(
        (brushedCount / filteredEntries.length) * 100,
      ),
      anxietyEpisodes: fearCount,
      cooperationEvolution: Math.round(
        cooperationTotal / filteredEntries.length,
      ),
      unhealthyFoodFrequency: Math.round(
        (candyCount / filteredEntries.length) * 100,
      ),
    };
  }, [filteredEntries]);

  const odontogramSummary = useMemo(() => {
    const teethWithCaries = new Set<number>();
    const teethWithPain = new Set<number>();
    const missingTeeth = new Set<number>();

    const latestToothState = new Map<number, ToothRecord>();

    filteredEntries
      .map((entry, index) => ({ entry, index }))
      .sort((left, right) => {
        const dateCompare = left.entry.date.localeCompare(right.entry.date);
        if (dateCompare !== 0) {
          return dateCompare;
        }

        return left.index - right.index;
      })
      .forEach(({ entry }) => {
        (entry.odontogram ?? []).forEach((tooth) => {
          latestToothState.set(tooth.toothNumber, tooth);
        });
      });

    latestToothState.forEach((tooth) => {
      if (!tooth.hasTooth) {
        missingTeeth.add(tooth.toothNumber);
      }

      if (tooth.hasTooth && tooth.hasCaries) {
        teethWithCaries.add(tooth.toothNumber);
      }

      if (tooth.hasTooth && tooth.hasPain) {
        teethWithPain.add(tooth.toothNumber);
      }
    });

    const toSortedArray = (values: Set<number>) =>
      Array.from(values).sort((a, b) => a - b);

    const selectedTeeth = Array.from(latestToothState.keys()).sort(
      (a, b) => a - b,
    );

    return {
      totalTeeth: selectedTeeth.length,
      cariesCount: teethWithCaries.size,
      painCount: teethWithPain.size,
      missingCount: missingTeeth.size,
      selectedTeeth,
      teethWithCaries: toSortedArray(teethWithCaries),
      teethWithPain: toSortedArray(teethWithPain),
      missingTeeth: toSortedArray(missingTeeth),
    };
  }, [filteredEntries]);

  const currentPatient =
    patients.find((item) => item.id === selectedPatientId) ?? null;
  const selectedDateLabel = formatDateLabel(selectedDate);
  const historyDateLabel = formatDateLabel(historyDate);

  const calendarMarkedDates = useMemo(() => {
    const marked: Record<string, any> = {};

    entries.forEach((entry) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
        return;
      }

      marked[entry.date] = {
        ...(marked[entry.date] ?? {}),
        marked: true,
        dotColor: themeColors.accent,
      };
    });

    marked[selectedDate] = {
      ...(marked[selectedDate] ?? {}),
      selected: true,
      selectedColor: themeColors.accent,
      selectedTextColor: themeColors.white,
    };

    return marked;
  }, [entries, selectedDate]);

  const mapRecordsToEntries = (records: BackendRecord[]): DailyEntry[] => {
    return records.map((record) => ({
      id: record.id,
      date: record.date,
      dateLabel: formatDateLabel(record.date),
      brushed: record.brushed,
      fear: record.fear,
      sleptWell: record.sleptWell,
      ateTooMuchCandy: record.ateTooMuchCandy,
      mood: record.mood,
      odontogram: Array.isArray(record.odontogram)
        ? record.odontogram
        : undefined,
      photoDataUrl: normalizePhotoUri(record.photoDataUrl) ?? undefined,
    }));
  };

  const saveOdontogramRecord = (record: ToothRecord) => {
    setOdontogramRecords((current) => {
      const index = current.findIndex(
        (item) => item.toothNumber === record.toothNumber,
      );
      if (index < 0) {
        return [...current, record];
      }

      const copy = [...current];
      copy[index] = record;
      return copy;
    });
  };

  const openOdontogramStep = () => {
    const selectedEntry = entries.find((entry) => entry.date === selectedDate);
    const latestEntryWithOdontogram = entries.find(
      (entry) => (entry.odontogram?.length ?? 0) > 0,
    );

    if (selectedEntry && (selectedEntry.odontogram?.length ?? 0) > 0) {
      setOdontogramPrefillLabel(
        `Pré-carregado do dia selecionado: ${selectedEntry.dateLabel}`,
      );
      setOdontogramSourceDate(selectedEntry.date);
    } else if (latestEntryWithOdontogram) {
      setOdontogramPrefillLabel(
        `Pré-carregado do último registro: ${latestEntryWithOdontogram.dateLabel}`,
      );
      setOdontogramSourceDate(latestEntryWithOdontogram.date);
    } else {
      setOdontogramPrefillLabel(null);
      setOdontogramSourceDate(null);
    }

    setOdontogramRecords(
      selectedEntry?.odontogram ?? latestEntryWithOdontogram?.odontogram ?? [],
    );
    navigateStep("odontogram");
  };

  const deleteOdontogramRecord = async (toothNumber: number) => {
    setOdontogramRecords((current) =>
      current.filter((item) => item.toothNumber !== toothNumber),
    );

    if (!selectedPatientId || !odontogramSourceDate) {
      return;
    }

    setIsSyncing(true);
    try {
      await removeToothFromRecord(
        selectedPatientId,
        odontogramSourceDate,
        toothNumber,
      );

      const latestRecords = await fetchRecords(selectedPatientId);
      const mappedEntries = mapRecordsToEntries(latestRecords);
      setEntries(mappedEntries);
      setSyncError(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o dente do odontograma.";

      const isToothAlreadyMissing =
        message.toLowerCase().includes("dente não encontrado") ||
        message.toLowerCase().includes("dente nao encontrado");

      const isRecordMissing =
        message.toLowerCase().includes("registro diário não encontrado") ||
        message.toLowerCase().includes("registro diario nao encontrado") ||
        message.toLowerCase().includes("registro diário nao encontrado") ||
        message.toLowerCase().includes("registro diario não encontrado");

      if (!isToothAlreadyMissing && !isRecordMissing) {
        setSyncError(message);
        Alert.alert("Erro ao excluir dente", message);
      } else {
        setSyncError(null);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const normalizePhotoUri = (value?: string): string | null => {
    if (typeof value !== "string") {
      return null;
    }

    const normalized = value.trim();
    if (!normalized) {
      return null;
    }

    if (
      normalized.startsWith("data:image/") ||
      normalized.startsWith("http://") ||
      normalized.startsWith("https://") ||
      normalized.startsWith("file://")
    ) {
      return normalized;
    }

    const looksLikeBase64 = /^[A-Za-z0-9+/=\n\r]+$/.test(normalized);
    if (looksLikeBase64) {
      return `data:image/jpeg;base64,${normalized.replace(/\s+/g, "")}`;
    }

    return null;
  };

  const extractPhotoItems = (
    dailyEntries: DailyEntry[],
  ): ProgressPhotoItem[] => {
    return dailyEntries
      .filter(
        (entry): entry is DailyEntry & { photoDataUrl: string } =>
          typeof entry.photoDataUrl === "string" &&
          entry.photoDataUrl.trim().length > 0,
      )
      .map((entry) => ({
        uri: entry.photoDataUrl,
        date: entry.date,
        dateLabel: entry.dateLabel,
      }));
  };

  const capturePhotoForDiary = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permissão necessária",
        "Permita o uso da câmera para tirar foto no registro diário.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.5,
      base64: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    if (!asset?.base64) {
      Alert.alert(
        "Falha na foto",
        "Não foi possível preparar a imagem para envio.",
      );
      return;
    }

    const mimeType =
      typeof asset.mimeType === "string" && asset.mimeType.startsWith("image/")
        ? asset.mimeType
        : "image/jpeg";
    setPhotoDataUrl(`data:${mimeType};base64,${asset.base64}`);
    setPhotoPreviewUri(asset.uri);
  };

  const initializeData = async () => {
    setIsSyncing(true);
    setSyncError(null);

    try {
      const fetchedPatients = await loadPatients();
      setPatients(fetchedPatients);

      const storedId = await AsyncStorage.getItem(STORAGE_PATIENT_ID_KEY);
      if (
        storedId &&
        fetchedPatients.some((patient) => patient.id === storedId)
      ) {
        setSelectedPatientId(storedId);
        const records = await fetchRecords(storedId);
        setEntries(mapRecordsToEntries(records));
      }
    } catch {
      setSyncError(
        `Sem conexão com backend (${API_BASE_URL}). Confira o servidor e a URL EXPO_PUBLIC_API_URL.`,
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const testBackendConnection = async () => {
    setIsSyncing(true);

    try {
      await checkHealth();
      setSyncError(null);
      Alert.alert("Conexão OK", `Backend ativo em ${API_BASE_URL}`);
    } catch {
      const message =
        "Não foi possível conectar ao backend. Verifique a URL e tente novamente.";
      setSyncError(message);
      Alert.alert("Falha de conexão", message);
    } finally {
      setIsSyncing(false);
    }
  };

  const clearNewPatientForm = () => {
    resetPatientFormData();
  };

  const addNewPatient = async () => {
    const name = newPatientName.trim();
    if (!name) {
      Alert.alert("Nome obrigatório", "Digite o nome do paciente.");
      return;
    }

    const motherName = newPatientMotherName.trim();
    const birthDate = newPatientBirthDate.trim();
    const notes = newPatientNotes.trim();

    if (birthDate && !isValidIsoDate(birthDate)) {
      Alert.alert(
        "Data inválida",
        "Nascimento deve estar no formato AAAA-MM-DD.",
      );
      return;
    }

    if (birthDate && birthDate > todayIso) {
      Alert.alert("Data inválida", "Nascimento não pode ser uma data futura.");
      return;
    }

    setIsSyncing(true);

    try {
      const created = await createPatient({
        name,
        sex: newPatientSex ?? undefined,
        motherName: motherName || undefined,
        birthDate: birthDate || undefined,
        notes: notes || undefined,
        clinicalProfile:
          normalizeClinicalProfile(newPatientClinicalProfile) ?? undefined,
      });

      setPatients((current) => [created, ...current]);
      setSelectedPatientId(created.id);
      clearNewPatientForm();
      setSyncError(null);

      await AsyncStorage.setItem(STORAGE_PATIENT_ID_KEY, created.id);
      const records = await fetchRecords(created.id);
      setEntries(mapRecordsToEntries(records));
    } catch {
      setSyncError("Não foi possível cadastrar paciente no backend.");
      Alert.alert("Erro", "Não foi possível cadastrar paciente.");
    } finally {
      setIsSyncing(false);
    }
  };

  const confirmDeletePatient = (patient: Patient) => {
    Alert.alert(
      "Apagar paciente",
      `Deseja apagar ${patient.name}? Essa ação remove também todo o histórico.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: () => {
            void deletePatientById(patient.id);
          },
        },
      ],
    );
  };

  const deletePatientById = async (patientId: string) => {
    setIsSyncing(true);

    const applyPatientRemovalLocally = async () => {
      setPatients((current) =>
        current.filter((patient) => patient.id !== patientId),
      );

      if (selectedPatientId === patientId) {
        setSelectedPatientId(null);
        setEntries([]);
        setHistoryFilterDate(null);
        setOdontogramRecords([]);
        await AsyncStorage.removeItem(STORAGE_PATIENT_ID_KEY);
      }
    };

    try {
      await removePatient(patientId);

      await applyPatientRemovalLocally();

      setSyncError(null);
      Alert.alert("Paciente apagado", "Cadastro removido com sucesso.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível apagar o paciente.";

      const isPatientAlreadyMissing =
        message.toLowerCase().includes("paciente não encontrado") ||
        message.toLowerCase().includes("paciente nao encontrado");

      if (isPatientAlreadyMissing) {
        await applyPatientRemovalLocally();
        setSyncError(null);
        Alert.alert("Paciente apagado", "Cadastro removido com sucesso.");
      } else {
        setSyncError(message);
        Alert.alert("Erro", message);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const loadSelectedPatientRecords = async (
    nextStep: Step,
    filterDate?: string,
  ) => {
    if (!selectedPatientId) {
      Alert.alert(
        "Selecione um paciente",
        "Escolha um paciente para continuar.",
      );
      return;
    }

    setIsSyncing(true);

    if (nextStep === "daily") {
      setPhotoDataUrl(null);
      setPhotoPreviewUri(null);
    }

    try {
      const patientExists = patients.some(
        (patient) => patient.id === selectedPatientId,
      );
      if (!patientExists) {
        const refreshed = await loadPatients();
        setPatients(refreshed);
        const stillExists = refreshed.some(
          (patient) => patient.id === selectedPatientId,
        );
        if (!stillExists) {
          throw new Error(
            "Paciente não encontrado. Atualize a lista e tente novamente.",
          );
        }
      }

      await AsyncStorage.setItem(STORAGE_PATIENT_ID_KEY, selectedPatientId);
      const records = await fetchRecords(selectedPatientId, filterDate);
      setEntries(mapRecordsToEntries(records));
      setHistoryFilterDate(filterDate ?? null);
      setSyncError(null);
      navigateStep(nextStep);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os dados do paciente.";
      setSyncError("Não foi possível carregar os dados do paciente.");
      Alert.alert("Erro", message);
    } finally {
      setIsSyncing(false);
    }
  };

  const onSelectCalendarDate = (day: DateData) => {
    setSelectedDate(day.dateString);
    setShowCalendar(false);
  };

  const saveDiary = async () => {
    if (!selectedPatientId) {
      Alert.alert(
        "Sem paciente",
        "Selecione um paciente para salvar o diário.",
      );
      navigateStep("patient");
      return;
    }

    if (!isValidIsoDate(selectedDate)) {
      Alert.alert("Data inválida", "Use o formato AAAA-MM-DD.");
      return;
    }

    setIsSyncing(true);

    try {
      await createRecord(selectedPatientId, {
        date: selectedDate,
        brushed,
        fear,
        sleptWell,
        ateTooMuchCandy,
        mood,
        triggers: selectedTriggers,
        odontogram: odontogramRecords,
        photoDataUrl: photoDataUrl ?? undefined,
      });

      const records = await fetchRecords(selectedPatientId);
      setEntries(mapRecordsToEntries(records));
      setHistoryFilterDate(null);
      setSyncError(null);
      navigateStep("progress");
      Alert.alert("Diário salvo", "Registro enviado para o backend.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível salvar no backend.";
      setSyncError(message);
      Alert.alert("Erro", message);
    } finally {
      setIsSyncing(false);
    }
  };

  const startNewDiaryFlow = () => {
    resetDiaryFormData();
    setHistoryFilterDate(null);
    navigateStep("daily");
  };

  const openHistoryFilterModal = () => {
    if (!selectedPatientId) {
      Alert.alert(
        "Selecione um paciente",
        "Escolha um paciente para ver o histórico.",
      );
      return;
    }

    setHistoryDate(todayIso);
    setShowHistoryDateCalendar(false);
    setShowHistoryFilterModal(true);
  };

  const closeHistoryFilterModal = () => {
    setShowHistoryFilterModal(false);
    setShowHistoryDateCalendar(false);
  };

  const viewGeneralHistory = async () => {
    closeHistoryFilterModal();
    await loadSelectedPatientRecords("progress");
  };

  const viewSpecificDateHistory = async () => {
    closeHistoryFilterModal();
    await loadSelectedPatientRecords("progress", historyDate);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      <StepHeader
        step={step}
        isSyncing={isSyncing}
        syncError={syncError}
        connectionLabel={`Conectado ao backend (${API_BASE_URL})`}
      />

      <AppRouter
        step={step}
        onStepChange={setStep}
        renderPatientStep={() => (
          <PatientStep
            patients={patients}
            selectedPatientId={selectedPatientId}
            onSelectPatient={setSelectedPatientId}
            onDeletePatient={confirmDeletePatient}
            showNewPatientForm={showNewPatientForm}
            onToggleNewPatientForm={() => {
              setShowNewPatientForm((current) => {
                const next = !current;
                if (!next) {
                  setShowBirthDateCalendar(false);
                }
                return next;
              });
            }}
            isSyncing={isSyncing}
            newPatientName={newPatientName}
            onChangeNewPatientName={setNewPatientName}
            newPatientSex={newPatientSex}
            patientSexOptions={patientSexOptions}
            onChangeNewPatientSex={setNewPatientSex}
            newPatientMotherName={newPatientMotherName}
            onChangeNewPatientMotherName={setNewPatientMotherName}
            newPatientBirthDate={newPatientBirthDate}
            showBirthDateCalendar={showBirthDateCalendar}
            onToggleBirthDateCalendar={() =>
              setShowBirthDateCalendar((current) => !current)
            }
            onSelectBirthDate={(day: DateData) => {
              setNewPatientBirthDate(day.dateString);
              setShowBirthDateCalendar(false);
            }}
            onClearBirthDate={() => setNewPatientBirthDate("")}
            onChangeNewPatientNotes={setNewPatientNotes}
            newPatientNotes={newPatientNotes}
            newPatientClinicalProfile={newPatientClinicalProfile}
            onChangeNewPatientClinicalProfile={setNewPatientClinicalProfile}
            formatDateLabel={formatDateLabel}
            todayIso={todayIso}
            onCancelNewPatientForm={clearNewPatientForm}
            onSaveNewPatient={addNewPatient}
            currentPatient={currentPatient}
            onContinue={() => loadSelectedPatientRecords("daily")}
            onOpenHistoryFilterModal={openHistoryFilterModal}
            showHistoryFilterModal={showHistoryFilterModal}
            onCloseHistoryFilterModal={closeHistoryFilterModal}
            onViewGeneralHistory={viewGeneralHistory}
            historyDate={historyDate}
            historyDateLabel={historyDateLabel}
            showHistoryDateCalendar={showHistoryDateCalendar}
            onToggleHistoryDateCalendar={() =>
              setShowHistoryDateCalendar((current) => !current)
            }
            onSelectHistoryDate={(day: DateData) => {
              setHistoryDate(day.dateString);
              setShowHistoryDateCalendar(false);
            }}
            onViewSpecificHistory={viewSpecificDateHistory}
            onTestBackendConnection={testBackendConnection}
          />
        )}
        renderDailyStep={() => (
          <DailyStep
            patientName={currentPatient?.name ?? null}
            selectedDate={selectedDate}
            selectedDateLabel={selectedDateLabel}
            todayIso={todayIso}
            showCalendar={showCalendar}
            onToggleCalendar={() => setShowCalendar((current) => !current)}
            onSelectToday={() => setSelectedDate(todayIso)}
            onSelectCalendarDate={onSelectCalendarDate}
            calendarMarkedDates={calendarMarkedDates}
            brushed={brushed}
            fear={fear}
            sleptWell={sleptWell}
            ateTooMuchCandy={ateTooMuchCandy}
            photoPreviewUri={photoPreviewUri}
            onTakePhoto={capturePhotoForDiary}
            onRemovePhoto={() => {
              setPhotoDataUrl(null);
              setPhotoPreviewUri(null);
            }}
            onToggleBrushed={() => setBrushed((current) => !current)}
            onToggleFear={() => setFear((current) => !current)}
            onToggleSleptWell={() => setSleptWell((current) => !current)}
            onToggleAteTooMuchCandy={() =>
              setAteTooMuchCandy((current) => !current)
            }
            onBack={() => navigateStep("patient")}
            onNext={openOdontogramStep}
          />
        )}
        renderOdontogramStep={() => (
          <OdontogramStep
            records={odontogramRecords}
            prefillLabel={odontogramPrefillLabel}
            onSaveToothRecord={saveOdontogramRecord}
            onDeleteToothRecord={deleteOdontogramRecord}
            onBack={() => navigateStep("daily")}
            onNext={() => navigateStep("mood")}
          />
        )}
        renderMoodStep={() => (
          <MoodStep
            mood={mood}
            selectedTriggers={selectedTriggers}
            triggerOptions={triggerOptions}
            isSyncing={isSyncing}
            onSelectMood={setMood}
            onToggleTrigger={(triggerId) => {
              setSelectedTriggers((current) => {
                if (current.includes(triggerId)) {
                  return current.filter((item) => item !== triggerId);
                }

                return [...current, triggerId];
              });
            }}
            onBack={() => navigateStep("odontogram")}
            onSave={saveDiary}
          />
        )}
        renderProgressStep={() => (
          <ProgressStep
            patientName={currentPatient?.name ?? null}
            progress={progress}
            entriesCount={filteredEntries.length}
            historyDateLabel={historyFilterDate ? historyDateLabel : null}
            photoItems={extractPhotoItems(filteredEntries)}
            odontogramSummary={odontogramSummary}
            onNewDiary={startNewDiaryFlow}
            onSwitchPatient={() => {
              setHistoryFilterDate(null);
              navigateStep("patient");
            }}
          />
        )}
      />
    </SafeAreaView>
  );
}
