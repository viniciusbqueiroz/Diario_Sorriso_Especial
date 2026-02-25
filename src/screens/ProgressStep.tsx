import { useState } from "react";
import { Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { ProgressRow } from "../components/ProgressRow";
import { ProgressMetrics, ProgressPhotoItem } from "../types/app";
import { appStyles as styles } from "../styles/appStyles";

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
  ...Array.from({ length: 16 }, (_item, index): [number, string] => [
    index + 1,
    upperToothLabels[index],
  ]),
  ...Array.from({ length: 16 }, (_item, index): [number, string] => [
    index + 17,
    lowerToothLabels[index],
  ]),
]);

const formatTeethList = (values: number[]) => {
  return values
    .map((value) => toothLabelByNumber.get(value) ?? String(value))
    .join(", ");
};

type ProgressStepProps = {
  patientName: string | null;
  progress: ProgressMetrics;
  entriesCount: number;
  historyDateLabel: string | null;
  photoItems: ProgressPhotoItem[];
  odontogramSummary: {
    totalTeeth: number;
    cariesCount: number;
    painCount: number;
    missingCount: number;
    selectedTeeth: number[];
    teethWithCaries: number[];
    teethWithPain: number[];
    missingTeeth: number[];
  };
  onNewDiary: () => void;
  onSwitchPatient: () => void;
};

export function ProgressStep({
  patientName,
  progress,
  entriesCount,
  historyDateLabel,
  photoItems,
  odontogramSummary,
  onNewDiary,
  onSwitchPatient,
}: ProgressStepProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhotoItem | null>(
    null,
  );
  const dailyPhoto = historyDateLabel ? photoItems[0] : null;

  return (
    <>
      <ScrollView contentContainerStyle={styles.screenContent}>
        <Text style={styles.sectionTitle}>📈 Gráfico de progresso</Text>
        <Text style={styles.sectionDescription}>
          {patientName
            ? historyDateLabel
              ? `Paciente: ${patientName} • Dia ${historyDateLabel}`
              : `Paciente: ${patientName}`
            : "Resumo da evolução"}
        </Text>

        <ProgressRow
          label="Frequência de escovação"
          value={progress.brushingFrequency}
          valueSuffix="%"
        />
        <ProgressRow
          label="Episódios de ansiedade"
          value={progress.anxietyEpisodes}
          max={Math.max(entriesCount, 1)}
          valueSuffix={` / ${entriesCount || 1}`}
        />
        <ProgressRow
          label="Evolução da cooperação"
          value={progress.cooperationEvolution}
          valueSuffix="%"
        />
        <ProgressRow
          label="Hábitos alimentares (doces)"
          value={progress.unhealthyFoodFrequency}
          valueSuffix="%"
        />

        <Text style={styles.sectionHint}>
          {entriesCount === 0
            ? "Ainda não há registros para este paciente."
            : `Total de registros: ${entriesCount}`}
        </Text>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>🦷 Resumo do odontograma</Text>
          {odontogramSummary.totalTeeth === 0 ? (
            <Text style={styles.sectionHint}>
              Nenhum dente registrado no odontograma.
            </Text>
          ) : (
            <>
              <Text style={styles.sectionCardSubtitle}>
                Dentes registrados: {odontogramSummary.totalTeeth}
              </Text>
              <Text style={styles.sectionHint}>
                Selecionados: {formatTeethList(odontogramSummary.selectedTeeth)}
              </Text>
              <Text style={styles.sectionCardSubtitle}>
                Cárie: {odontogramSummary.cariesCount} • Dor:{" "}
                {odontogramSummary.painCount} • Ausente:{" "}
                {odontogramSummary.missingCount}
              </Text>

              {odontogramSummary.teethWithCaries.length > 0 ? (
                <Text style={styles.sectionHint}>
                  Com cárie:{" "}
                  {formatTeethList(odontogramSummary.teethWithCaries)}
                </Text>
              ) : null}

              {odontogramSummary.teethWithPain.length > 0 ? (
                <Text style={styles.sectionHint}>
                  Com dor: {formatTeethList(odontogramSummary.teethWithPain)}
                </Text>
              ) : null}

              {odontogramSummary.missingTeeth.length > 0 ? (
                <Text style={styles.sectionHint}>
                  Ausentes: {formatTeethList(odontogramSummary.missingTeeth)}
                </Text>
              ) : null}
            </>
          )}
        </View>

        {historyDateLabel ? (
          <View style={styles.historyPhotoCard}>
            <Text style={styles.historyPhotoTitle}>📸 Foto do dia</Text>
            {dailyPhoto ? (
              <Pressable onPress={() => setSelectedPhoto(dailyPhoto)}>
                <Image
                  source={{ uri: dailyPhoto.uri }}
                  style={styles.historyPhotoImage}
                  resizeMode="cover"
                />
              </Pressable>
            ) : (
              <Text style={styles.sectionHint}>
                Não há foto cadastrada para este dia.
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.historyPhotoCard}>
            <Text style={styles.historyPhotoTitle}>🧸 Galeria de fotos</Text>
            {photoItems.length === 0 ? (
              <Text style={styles.sectionHint}>
                Nenhuma foto registrada ainda.
              </Text>
            ) : (
              <View style={styles.galleryGrid}>
                {photoItems.map((item, index) => (
                  <Pressable
                    key={`gallery-photo-${index}`}
                    onPress={() => setSelectedPhoto(item)}
                    style={styles.galleryImage}
                  >
                    <Image
                      source={{ uri: item.uri }}
                      style={styles.galleryImage}
                      resizeMode="cover"
                    />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        <Pressable style={styles.primaryButton} onPress={onNewDiary}>
          <Text style={styles.primaryButtonText}>📝 Novo registro diário</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onSwitchPatient}>
          <Text style={styles.secondaryButtonText}>👥 Trocar paciente</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={Boolean(selectedPhoto)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.fullscreenBackdrop}>
          <Pressable
            style={styles.modalOverlayTap}
            onPress={() => setSelectedPhoto(null)}
          />
          {selectedPhoto ? (
            <View style={styles.fullscreenContent}>
              <Image
                source={{ uri: selectedPhoto.uri }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
              <Text style={styles.fullscreenCaption}>
                Foto de {selectedPhoto.dateLabel}
              </Text>
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}
