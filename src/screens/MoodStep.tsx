import { Pressable, ScrollView, Text, View } from "react-native";
import { moodOptions } from "../constants/app";
import { Mood, Trigger } from "../types/app";
import { appStyles as styles } from "../styles/appStyles";

type MoodStepProps = {
  mood: Mood;
  selectedTriggers: Trigger[];
  triggerOptions: { id: Trigger; emoji: string; label: string }[];
  isSyncing: boolean;
  onSelectMood: (value: Mood) => void;
  onToggleTrigger: (triggerId: Trigger) => void;
  onBack: () => void;
  onSave: () => void;
};

export function MoodStep({
  mood,
  selectedTriggers,
  triggerOptions,
  isSyncing,
  onSelectMood,
  onToggleTrigger,
  onBack,
  onSave,
}: MoodStepProps) {
  const moodDetails: Record<Mood, string> = {
    muito_bom: "Muito receptivo(a), tranquilo(a) e colaborativo(a).",
    bom: "Coopera bem, com pequenas oscilações ao longo do dia.",
    neutro: "Sem grande reação emocional, precisa de mais incentivo.",
    triste: "Mais sensível e pouco colaborativo(a), requer acolhimento.",
  };

  const selectedMood = moodOptions.find((option) => option.id === mood);

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <Text style={styles.sectionTitle}>😊 Humor geral</Text>
      <Text style={styles.sectionDescription}>
        Selecione como foi o humor da criança hoje.
      </Text>

      <View style={styles.moodGrid}>
        {moodOptions.map((option) => {
          const selected = mood === option.id;
          return (
            <Pressable
              key={option.id}
              style={[styles.moodCard, selected && styles.moodCardSelected]}
              onPress={() => onSelectMood(option.id)}
            >
              <Text style={styles.moodEmoji}>{option.emoji}</Text>
              <Text style={styles.moodLabel}>{option.label}</Text>
              <Text style={styles.moodSubLabel}>Cooperação {option.coop}%</Text>
            </Pressable>
          );
        })}
      </View>

      {selectedMood ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>🔎 Humor selecionado</Text>
          <Text style={styles.sectionCardSubtitle}>
            {selectedMood.emoji} {selectedMood.label} • Cooperação estimada:{" "}
            {selectedMood.coop}%
          </Text>
          <Text style={styles.sectionHint}>{moodDetails[selectedMood.id]}</Text>
        </View>
      ) : null}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionCardTitle}>🧩 Gatilhos percebidos hoje</Text>
        <Text style={styles.sectionCardSubtitle}>
          Marque os fatores que podem ter influenciado o humor.
        </Text>

        <View style={styles.triggerGrid}>
          {triggerOptions.map((trigger) => {
            const selected = selectedTriggers.includes(trigger.id);
            return (
              <Pressable
                key={trigger.id}
                style={[
                  styles.triggerChip,
                  selected && styles.triggerChipSelected,
                ]}
                onPress={() => onToggleTrigger(trigger.id)}
              >
                <Text style={styles.triggerChipText}>
                  {trigger.emoji} {trigger.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
            style={[
              styles.primaryButton,
              styles.halfButton,
              isSyncing && styles.buttonDisabled,
            ]}
            onPress={onSave}
            disabled={isSyncing}
          >
            <Text style={styles.primaryButtonText}>💾 Salvar</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
