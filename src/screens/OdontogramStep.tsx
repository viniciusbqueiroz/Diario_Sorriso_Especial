import { Fragment, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { ToothRecord, ToothSensitivity } from "../types/app";
import { appStyles as styles, themeColors } from "../styles/appStyles";

type OdontogramStepProps = {
  records: ToothRecord[];
  prefillLabel: string | null;
  onSaveToothRecord: (record: ToothRecord) => void;
  onDeleteToothRecord: (toothNumber: number) => void;
  onBack: () => void;
  onNext: () => void;
};

const UPPER_TEETH = Array.from({ length: 16 }, (_item, index) => index + 1);
const LOWER_TEETH = Array.from({ length: 16 }, (_item, index) => index + 17);

const upperToothLabels = [
  "18",
  "17",
  "16",
  "15",
  "14",
  "13",
  "12",
  "11",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
];

const lowerToothLabels = [
  "48",
  "47",
  "46",
  "45",
  "44",
  "43",
  "42",
  "41",
  "31",
  "32",
  "33",
  "34",
  "35",
  "36",
  "37",
  "38",
];

const toothLabelByNumber = new Map<number, string>([
  ...UPPER_TEETH.map((toothNumber, index): [number, string] => [
    toothNumber,
    upperToothLabels[index],
  ]),
  ...LOWER_TEETH.map((toothNumber, index): [number, string] => [
    toothNumber,
    lowerToothLabels[index],
  ]),
]);
const sensitivityOptions: { id: ToothSensitivity; label: string }[] = [
  { id: "nenhuma", label: "Nenhuma" },
  { id: "leve", label: "Leve" },
  { id: "moderada", label: "Moderada" },
  { id: "alta", label: "Alta" },
];

export function OdontogramStep({
  records,
  prefillLabel,
  onSaveToothRecord,
  onDeleteToothRecord,
  onBack,
  onNext,
}: OdontogramStepProps) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [hasExistingRecord, setHasExistingRecord] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [hasTooth, setHasTooth] = useState(true);
  const [hasCaries, setHasCaries] = useState(false);
  const [hasPain, setHasPain] = useState(false);
  const [sensitivity, setSensitivity] = useState<ToothSensitivity>("nenhuma");
  const [notes, setNotes] = useState("");

  const getToothLabel = (toothNumber: number) => {
    return toothLabelByNumber.get(toothNumber) ?? String(toothNumber);
  };

  const renderToothCard = (toothNumber: number) => {
    const toothRecord = records.find(
      (record) => record.toothNumber === toothNumber,
    );
    const hasRecord = Boolean(toothRecord);
    const hasMissingTooth = toothRecord?.hasTooth === false;

    return (
      <Pressable
        key={toothNumber}
        style={[styles.toothCard, hasRecord && styles.toothCardFilled]}
        onPress={() => openToothModal(toothNumber)}
      >
        <Text style={styles.toothCardEmoji}>🦷</Text>
        <Text style={styles.toothCardLabel}>{getToothLabel(toothNumber)}</Text>
        {hasMissingTooth ? (
          <Text style={styles.toothCardMissingX}>✕</Text>
        ) : null}
      </Pressable>
    );
  };

  const renderToothRow = (teeth: number[]) => {
    return teeth.map((toothNumber, index) => (
      <Fragment key={toothNumber}>
        {renderToothCard(toothNumber)}
        {index === 7 ? <View style={styles.toothMidSeparator} /> : null}
      </Fragment>
    ));
  };

  const openToothModal = (toothNumber: number) => {
    const existing = records.find(
      (record) => record.toothNumber === toothNumber,
    );

    setSelectedTooth(toothNumber);
    setHasExistingRecord(Boolean(existing));
    setHasTooth(existing?.hasTooth ?? true);
    setHasCaries(existing?.hasCaries ?? false);
    setHasPain(existing?.hasPain ?? false);
    setSensitivity(existing?.sensitivity ?? "nenhuma");
    setNotes(existing?.notes ?? "");
    setModalVisible(true);
  };

  const saveToothModal = () => {
    if (!selectedTooth) {
      return;
    }

    onSaveToothRecord({
      toothNumber: selectedTooth,
      hasTooth,
      hasCaries,
      hasPain,
      sensitivity,
      notes: notes.trim() || undefined,
    });

    setModalVisible(false);
  };

  const updateHasTooth = (value: boolean) => {
    setHasTooth(value);

    if (!value) {
      setHasCaries(false);
      setHasPain(false);
      setSensitivity("nenhuma");
      setNotes("");
    }
  };

  const deleteToothModal = () => {
    if (!selectedTooth) {
      return;
    }

    onDeleteToothRecord(selectedTooth);
    setModalVisible(false);
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.screenContent}>
        <Text style={styles.sectionTitle}>🦷 Odontograma</Text>
        <Text style={styles.sectionDescription}>
          Escolha o dente e preencha os dados clínicos.
        </Text>
        {prefillLabel ? (
          <Text style={styles.sectionHint}>{prefillLabel}</Text>
        ) : null}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>🖼️ Selecionar dente</Text>
          <Text style={styles.sectionCardSubtitle}>
            Toque no dente para abrir o preenchimento.
          </Text>
          <View style={styles.toothGrid}>
            <Text style={styles.toothRowTitle}>Arcada superior</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.toothRowScroll}
            >
              {renderToothRow(UPPER_TEETH)}
            </ScrollView>

            <Text style={styles.toothRowTitle}>Arcada inferior</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.toothRowScroll}
            >
              {renderToothRow(LOWER_TEETH)}
            </ScrollView>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>📌 Dentes preenchidos</Text>
          {records.length === 0 ? (
            <Text style={styles.sectionHint}>
              Nenhum dente preenchido ainda.
            </Text>
          ) : (
            <View style={styles.triggerGrid}>
              {records
                .slice()
                .sort((a, b) => a.toothNumber - b.toothNumber)
                .map((record) => (
                  <Pressable
                    key={record.toothNumber}
                    style={[styles.triggerChip, styles.triggerChipSelected]}
                    onPress={() => openToothModal(record.toothNumber)}
                  >
                    <Text style={styles.triggerChipText}>
                      Dente {getToothLabel(record.toothNumber)}
                    </Text>
                  </Pressable>
                ))}
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>🚀 Próximas ações</Text>
          <View style={styles.horizontalActions}>
            <Pressable
              style={[styles.secondaryButton, styles.halfButton]}
              onPress={onBack}
            >
              <Text style={styles.secondaryButtonText}>⬅️ Voltar</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryButton, styles.halfButton]}
              onPress={onNext}
            >
              <Text style={styles.primaryButtonText}>➡️ Próxima</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.modalOverlayTap}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalCard}>
            <Text style={styles.sectionTitle}>
              🦷 Dente {selectedTooth ? getToothLabel(selectedTooth) : ""}
            </Text>
            <ScrollView contentContainerStyle={styles.newPatientForm}>
              <Text style={styles.inputLabel}>Possui o dente?</Text>
              <View style={styles.triggerGrid}>
                <Pressable
                  style={[
                    styles.triggerChip,
                    hasTooth && styles.triggerChipSelected,
                  ]}
                  onPress={() => updateHasTooth(true)}
                >
                  <Text style={styles.triggerChipText}>✅ Sim</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.triggerChip,
                    !hasTooth && styles.triggerChipSelected,
                  ]}
                  onPress={() => updateHasTooth(false)}
                >
                  <Text style={styles.triggerChipText}>❌ Não</Text>
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>Tem cárie?</Text>
              <View style={styles.triggerGrid}>
                <Pressable
                  style={[
                    styles.triggerChip,
                    !hasTooth && styles.buttonDisabled,
                    hasCaries && styles.triggerChipSelected,
                  ]}
                  disabled={!hasTooth}
                  onPress={() => setHasCaries(true)}
                >
                  <Text style={styles.triggerChipText}>🦠 Sim</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.triggerChip,
                    !hasTooth && styles.buttonDisabled,
                    !hasCaries && styles.triggerChipSelected,
                  ]}
                  disabled={!hasTooth}
                  onPress={() => setHasCaries(false)}
                >
                  <Text style={styles.triggerChipText}>🙂 Não</Text>
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>Tem dor?</Text>
              <View style={styles.triggerGrid}>
                <Pressable
                  style={[
                    styles.triggerChip,
                    !hasTooth && styles.buttonDisabled,
                    hasPain && styles.triggerChipSelected,
                  ]}
                  disabled={!hasTooth}
                  onPress={() => setHasPain(true)}
                >
                  <Text style={styles.triggerChipText}>😣 Sim</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.triggerChip,
                    !hasTooth && styles.buttonDisabled,
                    !hasPain && styles.triggerChipSelected,
                  ]}
                  disabled={!hasTooth}
                  onPress={() => setHasPain(false)}
                >
                  <Text style={styles.triggerChipText}>😌 Não</Text>
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>Sensibilidade</Text>
              <View style={styles.triggerGrid}>
                {sensitivityOptions.map((option) => {
                  const selected = sensitivity === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      style={[
                        styles.triggerChip,
                        !hasTooth && styles.buttonDisabled,
                        selected && styles.triggerChipSelected,
                      ]}
                      disabled={!hasTooth}
                      onPress={() => setSensitivity(option.id)}
                    >
                      <Text style={styles.triggerChipText}>{option.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Outras informações</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Ex.: fratura, restauração, mobilidade..."
                style={[
                  styles.input,
                  styles.notesInput,
                  !hasTooth && styles.inputDisabled,
                ]}
                multiline
                editable={hasTooth}
                placeholderTextColor={themeColors.textPlaceholder}
              />

              {hasExistingRecord ? (
                <Pressable
                  style={styles.secondaryButton}
                  onPress={deleteToothModal}
                >
                  <Text style={styles.secondaryButtonText}>
                    🗑️ Excluir dente
                  </Text>
                </Pressable>
              ) : null}

              <View style={styles.horizontalActions}>
                <Pressable
                  style={[styles.secondaryButton, styles.halfButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.secondaryButtonText}>❌ Cancelar</Text>
                </Pressable>
                <Pressable
                  style={[styles.primaryButton, styles.halfButton]}
                  onPress={saveToothModal}
                >
                  <Text style={styles.primaryButtonText}>💾 Salvar dente</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
