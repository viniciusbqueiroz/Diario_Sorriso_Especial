import { ScrollView, Text, View } from "react-native";
import { stepItems } from "../constants/app";
import { Step } from "../types/app";
import { appStyles as styles, themeColors } from "../styles/appStyles";

type StepHeaderProps = {
  step: Step;
  isSyncing: boolean;
  syncError: string | null;
  connectionLabel: string;
};

const stepIcons: Record<Step, string> = {
  patient: "🧒",
  daily: "🪥",
  odontogram: "🦷",
  mood: "😊",
  progress: "📈",
};

function getStepIndex(step: Step): number {
  return stepItems.findIndex((item) => item.id === step);
}

export function StepHeader({ step }: StepHeaderProps) {
  return (
    <View style={styles.screenHeader}>
      <Text style={styles.title}>🌈 Diário do Sorriso Especial</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stepperRow}
      >
        {stepItems.map((item, index) => {
          const currentIndex = getStepIndex(step);
          const isDoneOrCurrent = index <= currentIndex;

          return (
            <View key={item.id} style={styles.stepperItem}>
              <View
                style={[
                  styles.stepDot,
                  isDoneOrCurrent && styles.stepDotActive,
                ]}
              >
                <Text
                  style={[
                    styles.stepDotText,
                    isDoneOrCurrent && styles.stepDotTextActive,
                  ]}
                >
                  {index + 1}
                </Text>
              </View>
              <Text style={styles.stepLabel}>
                {stepIcons[item.id]} {item.label}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
