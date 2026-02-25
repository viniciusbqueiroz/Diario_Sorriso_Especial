import { Pressable, Text } from "react-native";
import { appStyles as styles } from "../styles/appStyles";

type ToggleRowProps = {
  emoji: string;
  label: string;
  value: boolean;
  onPress: () => void;
};

export function ToggleRow({ emoji, label, value, onPress }: ToggleRowProps) {
  return (
    <Pressable
      style={[styles.toggleRow, value && styles.toggleRowActive]}
      onPress={onPress}
    >
      <Text style={styles.toggleEmoji}>{emoji}</Text>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Text style={styles.toggleStatus}>{value ? "✅" : "⬜"}</Text>
    </Pressable>
  );
}
