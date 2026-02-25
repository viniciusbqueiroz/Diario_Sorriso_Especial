import { Text, View } from "react-native";
import { appStyles as styles } from "../styles/appStyles";

type ProgressRowProps = {
  label: string;
  value: number;
  max?: number;
  valueSuffix: string;
};

export function ProgressRow({
  label,
  value,
  max = 100,
  valueSuffix,
}: ProgressRowProps) {
  const percentage = Math.max(
    0,
    Math.min(100, Math.round((value / max) * 100)),
  );

  return (
    <View style={styles.progressRow}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>
          {value}
          {valueSuffix}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
}
