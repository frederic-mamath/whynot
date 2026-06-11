// The single sanctioned use of `Alert.alert` in the app. R8 (in
// scripts/arch-test.mjs) blocks direct calls everywhere else and points
// users here. Destructive flows go through `confirm({ ... })`.

import { Alert } from "react-native";

type ConfirmOptions = {
  title: string;
  message: string;
  destructiveLabel?: string;
  cancelLabel?: string;
};

export function confirm({
  title,
  message,
  destructiveLabel = "Supprimer",
  cancelLabel = "Annuler",
}: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: "cancel", onPress: () => resolve(false) },
      { text: destructiveLabel, style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

type NotifyOptions = {
  title: string;
  message: string;
  buttonLabel?: string;
};

export function notify({ title, message, buttonLabel = "OK" }: NotifyOptions): void {
  Alert.alert(title, message, [{ text: buttonLabel, style: "cancel" }]);
}

type ActionButton = {
  label: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

type ActionSheetOptions = {
  title: string;
  message?: string;
  buttons: ActionButton[];
};

export function actionSheet({ title, message, buttons }: ActionSheetOptions): void {
  Alert.alert(
    title,
    message,
    buttons.map((b) => ({
      text: b.label,
      style: b.style,
      onPress: b.onPress,
    })),
  );
}
