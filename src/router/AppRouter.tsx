import { useEffect, useState } from "react";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Step } from "../types/app";

type RootStackParamList = {
  patient: undefined;
  daily: undefined;
  odontogram: undefined;
  mood: undefined;
  progress: undefined;
};

type AppRouterProps = {
  step: Step;
  onStepChange: (step: Step) => void;
  renderPatientStep: () => React.ReactElement;
  renderDailyStep: () => React.ReactElement;
  renderOdontogramStep: () => React.ReactElement;
  renderMoodStep: () => React.ReactElement;
  renderProgressStep: () => React.ReactElement;
};

const navigationRef = createNavigationContainerRef<RootStackParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function isStep(value: string): value is Step {
  return (
    value === "patient" ||
    value === "daily" ||
    value === "odontogram" ||
    value === "mood" ||
    value === "progress"
  );
}

export function AppRouter({
  step,
  onStepChange,
  renderPatientStep,
  renderDailyStep,
  renderOdontogramStep,
  renderMoodStep,
  renderProgressStep,
}: AppRouterProps) {
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    if (!isNavigationReady || !navigationRef.isReady()) {
      return;
    }

    const currentRoute = navigationRef.getCurrentRoute()?.name;
    if (currentRoute !== step) {
      navigationRef.navigate(step);
    }
  }, [isNavigationReady, step]);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        setIsNavigationReady(true);
        const currentRoute = navigationRef.getCurrentRoute()?.name;
        if (currentRoute !== step) {
          navigationRef.navigate(step);
        }
      }}
      onStateChange={() => {
        const routeName = navigationRef.getCurrentRoute()?.name;
        if (routeName && isStep(routeName) && routeName !== step) {
          onStepChange(routeName);
        }
      }}
    >
      <Stack.Navigator
        initialRouteName="patient"
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          gestureDirection: "horizontal",
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      >
        <Stack.Screen name="patient">{renderPatientStep}</Stack.Screen>
        <Stack.Screen name="daily">{renderDailyStep}</Stack.Screen>
        <Stack.Screen name="odontogram">{renderOdontogramStep}</Stack.Screen>
        <Stack.Screen name="mood">{renderMoodStep}</Stack.Screen>
        <Stack.Screen name="progress">{renderProgressStep}</Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
