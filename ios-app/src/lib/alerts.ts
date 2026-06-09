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
