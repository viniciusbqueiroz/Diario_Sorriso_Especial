import { useState } from "react";
import { Calendar, DateData } from "react-native-calendars";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  BinaryAnswer,
  MedicationInUse,
  Patient,
  PatientClinicalProfile,
  PatientSex,
} from "../types/app";
import {
  appStyles as styles,
  calendarTheme,
  themeColors,
} from "../styles/appStyles";

type PatientStepProps = {
  patients: Patient[];
  selectedPatientId: string | null;
  onSelectPatient: (id: string) => void;
  onDeletePatient: (patient: Patient) => void;
  showNewPatientForm: boolean;
  onToggleNewPatientForm: () => void;
  isSyncing: boolean;
  newPatientName: string;
  onChangeNewPatientName: (value: string) => void;
  newPatientSex: PatientSex | null;
  patientSexOptions: { id: PatientSex; emoji: string; label: string }[];
  onChangeNewPatientSex: (value: PatientSex) => void;
  newPatientMotherName: string;
  onChangeNewPatientMotherName: (value: string) => void;
  newPatientBirthDate: string;
  showBirthDateCalendar: boolean;
  onToggleBirthDateCalendar: () => void;
  onSelectBirthDate: (day: DateData) => void;
  onClearBirthDate: () => void;
  onChangeNewPatientNotes: (value: string) => void;
  newPatientNotes: string;
  newPatientClinicalProfile: PatientClinicalProfile;
  onChangeNewPatientClinicalProfile: (value: PatientClinicalProfile) => void;
  formatDateLabel: (value: string) => string;
  todayIso: string;
  onCancelNewPatientForm: () => void;
  onSaveNewPatient: () => void;
  currentPatient: Patient | null;
  onContinue: () => void;
  onOpenHistoryFilterModal: () => void;
  showHistoryFilterModal: boolean;
  onCloseHistoryFilterModal: () => void;
  onViewGeneralHistory: () => void;
  historyDate: string;
  historyDateLabel: string;
  showHistoryDateCalendar: boolean;
  onToggleHistoryDateCalendar: () => void;
  onSelectHistoryDate: (day: DateData) => void;
  onViewSpecificHistory: () => void;
};

const medicalSpecialtyOptions = [
  "Neurologista",
  "Psiquiatra",
  "Cardiologista",
  "Endocrinologista",
  "Geneticista",
  "Outro",
] as const;

const systemicConditionOptions = [
  "Paralisia cerebral",
  "TEA (Transtorno do Espectro Autista)",
  "Síndrome de Down",
  "TDAH",
  "Epilepsia",
  "Doenças cardíacas",
  "Diabetes",
  "Hipertensão",
  "Doença renal",
  "Doença hepática",
  "Doença respiratória",
  "Distúrbio de coagulação",
  "Alergias medicamentosas",
  "Outros",
] as const;

const createEmptyMedication = (): MedicationInUse => ({
  medication: "",
  dosage: "",
  schedule: "",
  indication: "",
});

export function PatientStep({
  patients,
  selectedPatientId,
  onSelectPatient,
  onDeletePatient,
  showNewPatientForm,
  onToggleNewPatientForm,
  isSyncing,
  newPatientName,
  onChangeNewPatientName,
  newPatientSex,
  patientSexOptions,
  onChangeNewPatientSex,
  newPatientMotherName,
  onChangeNewPatientMotherName,
  newPatientBirthDate,
  showBirthDateCalendar,
  onToggleBirthDateCalendar,
  onSelectBirthDate,
  onClearBirthDate,
  onChangeNewPatientNotes,
  newPatientNotes,
  newPatientClinicalProfile,
  onChangeNewPatientClinicalProfile,
  formatDateLabel,
  todayIso,
  onCancelNewPatientForm,
  onSaveNewPatient,
  currentPatient,
  onContinue,
  onOpenHistoryFilterModal,
  showHistoryFilterModal,
  onCloseHistoryFilterModal,
  onViewGeneralHistory,
  historyDate,
  historyDateLabel,
  showHistoryDateCalendar,
  onToggleHistoryDateCalendar,
  onSelectHistoryDate,
  onViewSpecificHistory,
}: PatientStepProps) {
  const [showPatientDetailsModal, setShowPatientDetailsModal] = useState(false);

  const updateClinicalProfile = (changes: Partial<PatientClinicalProfile>) => {
    onChangeNewPatientClinicalProfile({
      ...newPatientClinicalProfile,
      ...changes,
    });
  };

  const toggleArrayItem = (
    currentValues: string[],
    value: string,
    field: "medicalSpecialties" | "systemicConditions",
  ) => {
    const next = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];
    updateClinicalProfile({ [field]: next } as Pick<
      PatientClinicalProfile,
      "medicalSpecialties" | "systemicConditions"
    >);
  };

  const renderYesNo = (
    value: BinaryAnswer,
    onChange: (next: BinaryAnswer) => void,
  ) => {
    return (
      <View style={styles.triggerGrid}>
        <Pressable
          style={[
            styles.triggerChip,
            value === true && styles.triggerChipSelected,
          ]}
          onPress={() => onChange(true)}
        >
          <Text style={styles.triggerChipText}>✅ Sim</Text>
        </Pressable>
        <Pressable
          style={[
            styles.triggerChip,
            value === false && styles.triggerChipSelected,
          ]}
          onPress={() => onChange(false)}
        >
          <Text style={styles.triggerChipText}>❌ Não</Text>
        </Pressable>
      </View>
    );
  };

  const updateMedication = (
    index: number,
    key: keyof MedicationInUse,
    text: string,
  ) => {
    const next = [...newPatientClinicalProfile.medicationsInUse];
    const current = next[index] ?? createEmptyMedication();
    next[index] = { ...current, [key]: text };
    updateClinicalProfile({ medicationsInUse: next });
  };

  const addMedication = () => {
    updateClinicalProfile({
      medicationsInUse: [
        ...newPatientClinicalProfile.medicationsInUse,
        createEmptyMedication(),
      ],
    });
  };

  const removeMedication = (index: number) => {
    const current = newPatientClinicalProfile.medicationsInUse;
    if (current.length <= 1) {
      updateClinicalProfile({ medicationsInUse: [createEmptyMedication()] });
      return;
    }

    updateClinicalProfile({
      medicationsInUse: current.filter(
        (_item, itemIndex) => itemIndex !== index,
      ),
    });
  };

  const formatBinaryAnswer = (value: BinaryAnswer) => {
    if (value === true) {
      return "Sim";
    }

    if (value === false) {
      return "Não";
    }

    return "Não informado";
  };

  const selectedClinicalProfile = currentPatient?.clinicalProfile;

  return (
    <>
      <ScrollView contentContainerStyle={styles.screenContent}>
        <Text style={styles.sectionTitle}>🧒 Selecione o paciente</Text>
        <Text style={styles.sectionDescription}>
          Escolha um paciente existente ou adicione um novo para iniciar.
        </Text>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>👥 Pacientes cadastrados</Text>
          {patients.length === 0 ? (
            <Text style={styles.sectionHint}>
              Nenhum paciente cadastrado ainda.
            </Text>
          ) : (
            <View style={styles.listBlock}>
              {patients.map((patient) => {
                const active = selectedPatientId === patient.id;
                return (
                  <View
                    key={patient.id}
                    style={[
                      styles.patientRow,
                      active && styles.patientRowActive,
                    ]}
                  >
                    <Pressable
                      style={styles.patientRowMainAction}
                      onPress={() => onSelectPatient(patient.id)}
                    >
                      <Text style={styles.patientName}>{patient.name}</Text>
                      <Text style={styles.patientSelect}>
                        {active ? "✅" : "⬜"}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.patientDeleteButton}
                      onPress={() => onDeletePatient(patient)}
                    >
                      <Text style={styles.patientDeleteButtonText}>🗑️</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={[styles.addPatientBox, styles.sectionCard]}>
          <Text style={styles.sectionCardTitle}>➕ Novo cadastro</Text>
          <Text style={styles.sectionCardSubtitle}>
            Cadastre uma nova criança para iniciar os registros.
          </Text>
          <Pressable
            style={[styles.secondaryButton, isSyncing && styles.buttonDisabled]}
            onPress={onToggleNewPatientForm}
            disabled={isSyncing}
          >
            <Text style={styles.secondaryButtonText}>
              ➕ Adicionar novo paciente
            </Text>
          </Pressable>
        </View>

        {currentPatient ? (
          <Pressable
            style={[styles.exampleInfoCard, styles.sectionCard]}
            onPress={() => setShowPatientDetailsModal(true)}
          >
            <Text style={styles.exampleInfoTitle}>
              ✨ Informações do paciente
            </Text>
            <Text style={styles.exampleInfoText}>
              Nome: {currentPatient.name}
            </Text>
            <Text style={styles.exampleInfoText}>
              Toque para ver todos os dados
            </Text>
          </Pressable>
        ) : null}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>🚀 Próximas ações</Text>
          <View style={styles.actionStack}>
            <Pressable
              style={[styles.primaryButton, isSyncing && styles.buttonDisabled]}
              onPress={onContinue}
              disabled={isSyncing}
            >
              <Text style={styles.primaryButtonText}>➡️ Continuar</Text>
            </Pressable>

            <Pressable
              style={[
                styles.secondaryButton,
                isSyncing && styles.buttonDisabled,
              ]}
              onPress={onOpenHistoryFilterModal}
              disabled={isSyncing}
            >
              <Text style={styles.secondaryButtonText}>📚 Ver histórico</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showNewPatientForm}
        transparent
        animationType="fade"
        onRequestClose={onCancelNewPatientForm}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.modalOverlayTap}
            onPress={onCancelNewPatientForm}
          />
          <View style={styles.modalCard}>
            <Text style={styles.sectionTitle}>🌟 Novo paciente</Text>
            <ScrollView contentContainerStyle={styles.newPatientForm}>
              <Text style={styles.inputLabel}>Nome do paciente</Text>
              <TextInput
                value={newPatientName}
                onChangeText={onChangeNewPatientName}
                placeholder="Nome da criança"
                style={styles.input}
                placeholderTextColor={themeColors.textPlaceholder}
              />

              <Text style={styles.inputLabel}>Sexo (opcional)</Text>
              <View style={styles.triggerGrid}>
                {patientSexOptions.map((option) => {
                  const active = newPatientSex === option.id;

                  return (
                    <Pressable
                      key={option.id}
                      style={[
                        styles.triggerChip,
                        active && styles.triggerChipSelected,
                      ]}
                      onPress={() => onChangeNewPatientSex(option.id)}
                    >
                      <Text style={styles.triggerChipText}>
                        {option.emoji} {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Nome do responsável</Text>
              <TextInput
                value={newPatientMotherName}
                onChangeText={onChangeNewPatientMotherName}
                placeholder="Nome da responsável"
                style={styles.input}
                placeholderTextColor={themeColors.textPlaceholder}
              />

              <Text style={styles.inputLabel}>Nascimento</Text>
              <Pressable onPress={onToggleBirthDateCalendar}>
                <View style={[styles.input, styles.inputPressable]}>
                  <Text
                    style={[
                      styles.birthInputText,
                      !newPatientBirthDate && styles.birthInputPlaceholder,
                    ]}
                  >
                    {newPatientBirthDate
                      ? `${formatDateLabel(newPatientBirthDate)}`
                      : "Selecionar data de nascimento"}
                  </Text>
                </View>
              </Pressable>

              {showBirthDateCalendar ? (
                <View style={styles.calendarBox}>
                  <Calendar
                    current={newPatientBirthDate || todayIso}
                    maxDate={todayIso}
                    onDayPress={onSelectBirthDate}
                    markedDates={
                      newPatientBirthDate
                        ? {
                            [newPatientBirthDate]: {
                              selected: true,
                              selectedColor: themeColors.accent,
                            },
                          }
                        : undefined
                    }
                    theme={calendarTheme}
                  />
                </View>
              ) : null}

              <Text style={styles.inputLabel}>Observações (opcional)</Text>
              <TextInput
                value={newPatientNotes}
                onChangeText={onChangeNewPatientNotes}
                placeholder="Informações relevantes para consulta"
                style={[styles.input, styles.notesInput]}
                multiline
                placeholderTextColor={themeColors.textPlaceholder}
              />

              <Text style={styles.sectionCardTitle}>
                🩺 Diagnóstico principal
              </Text>
              <Text style={styles.inputLabel}>
                Diagnóstico médico principal
              </Text>
              <TextInput
                value={newPatientClinicalProfile.mainDiagnosis ?? ""}
                onChangeText={(value) =>
                  updateClinicalProfile({ mainDiagnosis: value })
                }
                placeholder="Descreva o diagnóstico"
                style={styles.input}
                placeholderTextColor={themeColors.textPlaceholder}
              />

              <Text style={styles.inputLabel}>CID (se souber)</Text>
              <TextInput
                value={newPatientClinicalProfile.cid ?? ""}
                onChangeText={(value) => updateClinicalProfile({ cid: value })}
                placeholder="Ex.: F84.0"
                style={styles.input}
                placeholderTextColor={themeColors.textPlaceholder}
              />

              <Text style={styles.inputLabel}>Idade do diagnóstico</Text>
              <TextInput
                value={newPatientClinicalProfile.diagnosisAge ?? ""}
                onChangeText={(value) =>
                  updateClinicalProfile({ diagnosisAge: value })
                }
                placeholder="Ex.: 3 anos"
                style={styles.input}
                placeholderTextColor={themeColors.textPlaceholder}
              />

              <Text style={styles.inputLabel}>Médico responsável</Text>
              <TextInput
                value={newPatientClinicalProfile.responsibleDoctor ?? ""}
                onChangeText={(value) =>
                  updateClinicalProfile({ responsibleDoctor: value })
                }
                placeholder="Nome do médico"
                style={styles.input}
                placeholderTextColor={themeColors.textPlaceholder}
              />

              <Text style={styles.inputLabel}>
                Especialidades médicas acompanhadas
              </Text>
              <View style={styles.triggerGrid}>
                {medicalSpecialtyOptions.map((option) => {
                  const selected =
                    newPatientClinicalProfile.medicalSpecialties.includes(
                      option,
                    );

                  return (
                    <Pressable
                      key={option}
                      style={[
                        styles.triggerChip,
                        selected && styles.triggerChipSelected,
                      ]}
                      onPress={() =>
                        toggleArrayItem(
                          newPatientClinicalProfile.medicalSpecialties,
                          option,
                          "medicalSpecialties",
                        )
                      }
                    >
                      <Text style={styles.triggerChipText}>{option}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {newPatientClinicalProfile.medicalSpecialties.includes(
                "Outro",
              ) ? (
                <>
                  <Text style={styles.inputLabel}>Outro (especialidade)</Text>
                  <TextInput
                    value={
                      newPatientClinicalProfile.medicalSpecialtyOther ?? ""
                    }
                    onChangeText={(value) =>
                      updateClinicalProfile({ medicalSpecialtyOther: value })
                    }
                    placeholder="Informe a especialidade"
                    style={styles.input}
                    placeholderTextColor={themeColors.textPlaceholder}
                  />
                </>
              ) : null}

              <Text style={styles.inputLabel}>Condições sistêmicas</Text>
              <View style={styles.triggerGrid}>
                {systemicConditionOptions.map((option) => {
                  const selected =
                    newPatientClinicalProfile.systemicConditions.includes(
                      option,
                    );

                  return (
                    <Pressable
                      key={option}
                      style={[
                        styles.triggerChip,
                        selected && styles.triggerChipSelected,
                      ]}
                      onPress={() =>
                        toggleArrayItem(
                          newPatientClinicalProfile.systemicConditions,
                          option,
                          "systemicConditions",
                        )
                      }
                    >
                      <Text style={styles.triggerChipText}>{option}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {newPatientClinicalProfile.systemicConditions.includes(
                "Outros",
              ) ? (
                <>
                  <Text style={styles.inputLabel}>Outras condições</Text>
                  <TextInput
                    value={
                      newPatientClinicalProfile.systemicConditionOther ?? ""
                    }
                    onChangeText={(value) =>
                      updateClinicalProfile({ systemicConditionOther: value })
                    }
                    placeholder="Informe outras condições"
                    style={styles.input}
                    placeholderTextColor={themeColors.textPlaceholder}
                  />
                </>
              ) : null}

              <Text style={styles.sectionCardTitle}>
                ⚠️ Histórico de crises / intercorrências
              </Text>
              <Text style={styles.inputLabel}>
                Já apresentou crises convulsivas?
              </Text>
              {renderYesNo(newPatientClinicalProfile.hadSeizures, (next) =>
                updateClinicalProfile({ hadSeizures: next }),
              )}

              <Text style={styles.inputLabel}>Última crise</Text>
              <TextInput
                value={newPatientClinicalProfile.lastSeizure ?? ""}
                onChangeText={(value) =>
                  updateClinicalProfile({ lastSeizure: value })
                }
                placeholder="Data/descrição"
                style={styles.input}
                placeholderTextColor={themeColors.textPlaceholder}
              />

              <Text style={styles.inputLabel}>Frequência</Text>
              <TextInput
                value={newPatientClinicalProfile.seizureFrequency ?? ""}
                onChangeText={(value) =>
                  updateClinicalProfile({ seizureFrequency: value })
                }
                placeholder="Ex.: mensal"
                style={styles.input}
                placeholderTextColor={themeColors.textPlaceholder}
              />

              <Text style={styles.inputLabel}>
                Possui crises comportamentais?
              </Text>
              {renderYesNo(
                newPatientClinicalProfile.hasBehavioralCrises,
                (next) => updateClinicalProfile({ hasBehavioralCrises: next }),
              )}

              <Text style={styles.inputLabel}>Gatilhos conhecidos</Text>
              <TextInput
                value={newPatientClinicalProfile.behavioralTriggers ?? ""}
                onChangeText={(value) =>
                  updateClinicalProfile({ behavioralTriggers: value })
                }
                placeholder="Descrever gatilhos"
                style={[styles.input, styles.notesInput]}
                multiline
                placeholderTextColor={themeColors.textPlaceholder}
              />

              <Text style={styles.inputLabel}>
                Já precisou de internação hospitalar?
              </Text>
              {renderYesNo(
                newPatientClinicalProfile.hadHospitalization,
                (next) => updateClinicalProfile({ hadHospitalization: next }),
              )}

              <Text style={styles.inputLabel}>Motivo da internação</Text>
              <TextInput
                value={newPatientClinicalProfile.hospitalizationReason ?? ""}
                onChangeText={(value) =>
                  updateClinicalProfile({ hospitalizationReason: value })
                }
                placeholder="Motivo"
                style={styles.input}
                placeholderTextColor={themeColors.textPlaceholder}
              />

              <Text style={styles.inputLabel}>
                Já realizou procedimento sob anestesia geral?
              </Text>
              {renderYesNo(
                newPatientClinicalProfile.hadGeneralAnesthesia,
                (next) => updateClinicalProfile({ hadGeneralAnesthesia: next }),
              )}

              <Text style={styles.sectionCardTitle}>💊 Medicações em uso</Text>
              {newPatientClinicalProfile.medicationsInUse.map(
                (medication, index) => (
                  <View key={index} style={styles.medicationCard}>
                    <Text style={styles.inputLabel}>Medicamento</Text>
                    <TextInput
                      value={medication.medication}
                      onChangeText={(value) =>
                        updateMedication(index, "medication", value)
                      }
                      placeholder="Nome"
                      style={styles.input}
                      placeholderTextColor={themeColors.textPlaceholder}
                    />

                    <Text style={styles.inputLabel}>Dosagem</Text>
                    <TextInput
                      value={medication.dosage}
                      onChangeText={(value) =>
                        updateMedication(index, "dosage", value)
                      }
                      placeholder="Ex.: 10mg"
                      style={styles.input}
                      placeholderTextColor={themeColors.textPlaceholder}
                    />

                    <Text style={styles.inputLabel}>Horário</Text>
                    <TextInput
                      value={medication.schedule}
                      onChangeText={(value) =>
                        updateMedication(index, "schedule", value)
                      }
                      placeholder="Ex.: 8h / 20h"
                      style={styles.input}
                      placeholderTextColor={themeColors.textPlaceholder}
                    />

                    <Text style={styles.inputLabel}>Indicação</Text>
                    <TextInput
                      value={medication.indication}
                      onChangeText={(value) =>
                        updateMedication(index, "indication", value)
                      }
                      placeholder="Para que usa"
                      style={styles.input}
                      placeholderTextColor={themeColors.textPlaceholder}
                    />

                    <Pressable
                      style={styles.secondaryButton}
                      onPress={() => removeMedication(index)}
                    >
                      <Text style={styles.secondaryButtonText}>🗑️ Remover</Text>
                    </Pressable>
                  </View>
                ),
              )}

              <Pressable style={styles.secondaryButton} onPress={addMedication}>
                <Text style={styles.secondaryButtonText}>
                  ➕ Adicionar medicação
                </Text>
              </Pressable>

              <Text style={styles.inputLabel}>Usa anticoagulantes?</Text>
              {renderYesNo(
                newPatientClinicalProfile.usesAnticoagulants,
                (next) => updateClinicalProfile({ usesAnticoagulants: next }),
              )}

              <Text style={styles.inputLabel}>Usa anticonvulsivantes?</Text>
              {renderYesNo(
                newPatientClinicalProfile.usesAnticonvulsants,
                (next) => updateClinicalProfile({ usesAnticonvulsants: next }),
              )}

              <Text style={styles.inputLabel}>Usa psicotrópicos?</Text>
              {renderYesNo(
                newPatientClinicalProfile.usesPsychotropics,
                (next) => updateClinicalProfile({ usesPsychotropics: next }),
              )}

              <Text style={styles.inputLabel}>Faz uso de corticóides?</Text>
              {renderYesNo(
                newPatientClinicalProfile.usesCorticosteroids,
                (next) => updateClinicalProfile({ usesCorticosteroids: next }),
              )}

              <View style={styles.horizontalActions}>
                <Pressable
                  style={[styles.secondaryButton, styles.halfButton]}
                  onPress={onCancelNewPatientForm}
                >
                  <Text style={styles.secondaryButtonText}>❌ Cancelar</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.primaryButton,
                    styles.halfButton,
                    isSyncing && styles.buttonDisabled,
                  ]}
                  onPress={onSaveNewPatient}
                  disabled={isSyncing}
                >
                  <Text style={styles.primaryButtonText}>
                    💾 Salvar paciente
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPatientDetailsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPatientDetailsModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.modalOverlayTap}
            onPress={() => setShowPatientDetailsModal(false)}
          />
          <View style={styles.modalCard}>
            <Text style={styles.sectionTitle}>📋 Dados do paciente</Text>
            {currentPatient ? (
              <ScrollView contentContainerStyle={styles.newPatientForm}>
                <Text style={styles.exampleInfoText}>
                  Nome: {currentPatient.name}
                </Text>
                <Text style={styles.exampleInfoText}>
                  Sexo: {currentPatient.sex ?? "Não informado"}
                </Text>
                <Text style={styles.exampleInfoText}>
                  Responsável: {currentPatient.motherName ?? "Não informado"}
                </Text>
                <Text style={styles.exampleInfoText}>
                  Nascimento: {currentPatient.birthDate ?? "Não informado"}
                </Text>
                <Text style={styles.exampleInfoText}>
                  Observações: {currentPatient.notes ?? "Não informado"}
                </Text>

                <Text style={styles.sectionCardTitle}>
                  🩺 Diagnóstico principal
                </Text>
                <Text style={styles.exampleInfoText}>
                  Diagnóstico médico principal:{" "}
                  {selectedClinicalProfile?.mainDiagnosis ?? "Não informado"}
                </Text>
                <Text style={styles.exampleInfoText}>
                  CID: {selectedClinicalProfile?.cid ?? "Não informado"}
                </Text>
                <Text style={styles.exampleInfoText}>
                  Idade do diagnóstico:{" "}
                  {selectedClinicalProfile?.diagnosisAge ?? "Não informado"}
                </Text>
                <Text style={styles.exampleInfoText}>
                  Médico responsável:{" "}
                  {selectedClinicalProfile?.responsibleDoctor ??
                    "Não informado"}
                </Text>
                <Text style={styles.exampleInfoText}>
                  Especialidades médicas:{" "}
                  {selectedClinicalProfile?.medicalSpecialties.length
                    ? selectedClinicalProfile.medicalSpecialties.join(", ")
                    : "Não informado"}
                </Text>
                <Text style={styles.exampleInfoText}>
                  Outra especialidade:{" "}
                  {selectedClinicalProfile?.medicalSpecialtyOther ??
                    "Não informado"}
                </Text>
                <Text style={styles.exampleInfoText}>
                  Condições sistêmicas:{" "}
                  {selectedClinicalProfile?.systemicConditions.length
                    ? selectedClinicalProfile.systemicConditions.join(", ")
                    : "Não informado"}
                </Text>
                <Text style={styles.exampleInfoText}>
                  Outras condições:{" "}
                  {selectedClinicalProfile?.systemicConditionOther ??
                    "Não informado"}
                </Text>

                <Text style={styles.sectionCardTitle}>
                  ⚠️ Crises / intercorrências
                </Text>
                <Text style={styles.exampleInfoText}>
                  Crises convulsivas:{" "}
                  {formatBinaryAnswer(
                    selectedClinicalProfile?.hadSeizures ?? null,
                  )}
                </Text>
                <Text style={styles.exampleInfoText}>
                  Última crise:{" "}
                  {selectedClinicalProfile?.lastSeizure ?? "Não informado"}
                </Text>
                <Text style={styles.exampleInfoText}>
                  Frequência:{" "}
                  {selectedClinicalProfile?.seizureFrequency ?? "Não informado"}
                </Text>
                <Text style={styles.exampleInfoText}>
                  Crises comportamentais:{" "}
                  {formatBinaryAnswer(
                    selectedClinicalProfile?.hasBehavioralCrises ?? null,
                  )}
                </Text>
                <Text style={styles.exampleInfoText}>
                  Gatilhos conhecidos:{" "}
                  {selectedClinicalProfile?.behavioralTriggers ??
                    "Não informado"}
                </Text>
                <Text style={styles.exampleInfoText}>
                  Já precisou de internação:{" "}
                  {formatBinaryAnswer(
                    selectedClinicalProfile?.hadHospitalization ?? null,
                  )}
                </Text>
                <Text style={styles.exampleInfoText}>
                  Motivo da internação:{" "}
                  {selectedClinicalProfile?.hospitalizationReason ??
                    "Não informado"}
                </Text>
                <Text style={styles.exampleInfoText}>
                  Procedimento sob anestesia geral:{" "}
                  {formatBinaryAnswer(
                    selectedClinicalProfile?.hadGeneralAnesthesia ?? null,
                  )}
                </Text>

                <Text style={styles.sectionCardTitle}>💊 Medicações</Text>
                {selectedClinicalProfile?.medicationsInUse.length ? (
                  selectedClinicalProfile.medicationsInUse.map(
                    (medication, index) => (
                      <View
                        key={`${medication.medication}-${index}`}
                        style={styles.medicationCard}
                      >
                        <Text style={styles.exampleInfoText}>
                          Medicamento:{" "}
                          {medication.medication || "Não informado"}
                        </Text>
                        <Text style={styles.exampleInfoText}>
                          Dosagem: {medication.dosage || "Não informado"}
                        </Text>
                        <Text style={styles.exampleInfoText}>
                          Horário: {medication.schedule || "Não informado"}
                        </Text>
                        <Text style={styles.exampleInfoText}>
                          Indicação: {medication.indication || "Não informado"}
                        </Text>
                      </View>
                    ),
                  )
                ) : (
                  <Text style={styles.exampleInfoText}>
                    Nenhuma medicação informada.
                  </Text>
                )}

                <Text style={styles.exampleInfoText}>
                  Usa anticoagulantes:{" "}
                  {formatBinaryAnswer(
                    selectedClinicalProfile?.usesAnticoagulants ?? null,
                  )}
                </Text>
                <Text style={styles.exampleInfoText}>
                  Usa anticonvulsivantes:{" "}
                  {formatBinaryAnswer(
                    selectedClinicalProfile?.usesAnticonvulsants ?? null,
                  )}
                </Text>
                <Text style={styles.exampleInfoText}>
                  Usa psicotrópicos:{" "}
                  {formatBinaryAnswer(
                    selectedClinicalProfile?.usesPsychotropics ?? null,
                  )}
                </Text>
                <Text style={styles.exampleInfoText}>
                  Faz uso de corticóides:{" "}
                  {formatBinaryAnswer(
                    selectedClinicalProfile?.usesCorticosteroids ?? null,
                  )}
                </Text>

                <View style={styles.horizontalActions}>
                  <Pressable
                    style={[styles.secondaryButton, styles.halfButton]}
                    onPress={() => {
                      setShowPatientDetailsModal(false);
                      onDeletePatient(currentPatient);
                    }}
                    disabled={isSyncing}
                  >
                    <Text style={styles.secondaryButtonText}>
                      🗑️ Apagar paciente
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.primaryButton, styles.halfButton]}
                    onPress={() => setShowPatientDetailsModal(false)}
                  >
                    <Text style={styles.primaryButtonText}>Fechar</Text>
                  </Pressable>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showHistoryFilterModal}
        transparent
        animationType="fade"
        onRequestClose={onCloseHistoryFilterModal}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.modalOverlayTap}
            onPress={onCloseHistoryFilterModal}
          />
          <View style={styles.modalCard}>
            <Text style={styles.sectionTitle}>🖼️ Ver histórico</Text>
            <Text style={styles.sectionDescription}>
              Escolha como deseja visualizar.
            </Text>

            <Pressable
              style={styles.primaryButton}
              onPress={onViewGeneralHistory}
            >
              <Text style={styles.primaryButtonText}>📚 Histórico geral</Text>
            </Pressable>

            <Text style={styles.inputLabel}>
              Ou selecionar um dia específico
            </Text>
            <Pressable onPress={onToggleHistoryDateCalendar}>
              <View style={[styles.input, styles.inputPressable]}>
                <Text style={styles.birthInputText}>{historyDateLabel}</Text>
                <Text style={styles.selectedDateIso}>{historyDate}</Text>
              </View>
            </Pressable>

            {showHistoryDateCalendar ? (
              <View style={styles.calendarBox}>
                <Calendar
                  current={historyDate}
                  onDayPress={onSelectHistoryDate}
                  markedDates={{
                    [historyDate]: {
                      selected: true,
                      selectedColor: themeColors.accent,
                    },
                  }}
                  theme={calendarTheme}
                />
              </View>
            ) : null}

            <View style={styles.horizontalActions}>
              <Pressable
                style={[styles.secondaryButton, styles.halfButton]}
                onPress={onCloseHistoryFilterModal}
              >
                <Text style={styles.secondaryButtonText}>❌ Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, styles.halfButton]}
                onPress={onViewSpecificHistory}
              >
                <Text style={styles.primaryButtonText}>
                  🔎 Ver dia selecionado
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
