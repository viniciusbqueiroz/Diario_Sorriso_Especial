import { Calendar, DateData } from "react-native-calendars";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { ToggleRow } from "../components/ToggleRow";
import { appStyles as styles, calendarTheme } from "../styles/appStyles";

type DailyStepProps = {
  patientName: string | null;
  selectedDate: string;
  selectedDateLabel: string;
  todayIso: string;
  showCalendar: boolean;
  onToggleCalendar: () => void;
  onSelectToday: () => void;
  onSelectCalendarDate: (day: DateData) => void;
  calendarMarkedDates: Record<string, any>;
  brushed: boolean;
  fear: boolean;
  sleptWell: boolean;
  ateTooMuchCandy: boolean;
  photoPreviewUri: string | null;
  onTakePhoto: () => void;
  onRemovePhoto: () => void;
  onToggleBrushed: () => void;
  onToggleFear: () => void;
  onToggleSleptWell: () => void;
  onToggleAteTooMuchCandy: () => void;
  onBack: () => void;
  onNext: () => void;
};

export function DailyStep({
  patientName,
  selectedDate,
  selectedDateLabel,
  showCalendar,
  onToggleCalendar,
  onSelectToday,
  onSelectCalendarDate,
  calendarMarkedDates,
  brushed,
  fear,
  sleptWell,
  ateTooMuchCandy,
  photoPreviewUri,
  onTakePhoto,
  onRemovePhoto,
  onToggleBrushed,
  onToggleFear,
  onToggleSleptWell,
  onToggleAteTooMuchCandy,
  onBack,
  onNext,
}: DailyStepProps) {
  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <Text style={styles.sectionTitle}>🪥 Diário visual</Text>
      <Text style={styles.sectionDescription}>
        {patientName ? `Paciente: ${patientName}` : "Registro diário"}
      </Text>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionCardTitle}>🗓️ Data do registro</Text>
        <View style={styles.dateRow}>
          <Pressable
            style={styles.selectedDateBadge}
            onPress={onToggleCalendar}
          >
            <Text style={styles.selectedDateLabel}>{selectedDateLabel}</Text>
            {showCalendar ? (
              <View style={styles.calendarBox}>
                <Calendar
                  current={selectedDate}
                  onDayPress={onSelectCalendarDate}
                  markedDates={calendarMarkedDates}
                  theme={calendarTheme}
                />
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      <View
        style={[
          styles.photoPreviewCard,
          !photoPreviewUri && styles.photoPreviewCardEmpty,
        ]}
      >
        <Text style={styles.photoPreviewTitle}>📸 Foto do dia</Text>
        {photoPreviewUri ? (
          <Image
            source={{ uri: photoPreviewUri }}
            style={styles.photoPreviewImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.photoEmptyHint}>
            Toque em “📷 Tirar foto” para registrar este momento.
          </Text>
        )}

        <View style={styles.photoActionsRow}>
          <Pressable
            style={[styles.secondaryButton, styles.photoHalfButton]}
            onPress={onTakePhoto}
          >
            <Text style={styles.secondaryButtonText}>
              {photoPreviewUri ? "🔁 Trocar foto" : "📷 Tirar foto"}
            </Text>
          </Pressable>
          {photoPreviewUri ? (
            <Pressable
              style={[styles.secondaryButton, styles.photoHalfButton]}
              onPress={onRemovePhoto}
            >
              <Text style={styles.secondaryButtonText}>🗑️ Remover foto</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionCardTitle}>✅ Rotina do dia</Text>
        <ToggleRow
          emoji="🪥"
          label="Escovou os dentes"
          value={brushed}
          onPress={onToggleBrushed}
        />
        <ToggleRow
          emoji="😟"
          label="Teve medo hoje"
          value={fear}
          onPress={onToggleFear}
        />
        <ToggleRow
          emoji="😴"
          label="Dormiu bem"
          value={sleptWell}
          onPress={onToggleSleptWell}
        />
        <ToggleRow
          emoji="🍬"
          label="Comeu muito doce"
          value={ateTooMuchCandy}
          onPress={onToggleAteTooMuchCandy}
        />
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
  );
}
