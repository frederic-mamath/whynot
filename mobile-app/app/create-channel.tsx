import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useRouter, Stack } from "expo-router";
import { trpc } from "@/lib/trpc";

export default function CreateChannelScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("10");

  const createMutation = trpc.channel.create.useMutation({
    onSuccess: (data) => {
      // Navigate to host screen with the Agora credentials
      router.replace(
        `/channel/${data.channel.id}/host?token=${encodeURIComponent(data.token)}&appId=${data.appId}&uid=${data.uid}`,
      );
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleCreate = () => {
    if (!name.trim() || name.trim().length < 3) {
      Alert.alert("Validation", "Channel name must be at least 3 characters.");
      return;
    }

    const max = parseInt(maxParticipants, 10);
    if (isNaN(max) || max < 2 || max > 50) {
      Alert.alert("Validation", "Max participants must be between 2 and 50.");
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      maxParticipants: max,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Stack.Screen options={{ title: "Go Live" }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create a Live Channel</Text>
        <Text style={styles.subtitle}>
          Start streaming live to your audience
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Channel Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Summer Collection Live"
            placeholderTextColor={styles.placeholderColor.color}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Max Participants</Text>
          <TextInput
            style={styles.input}
            value={maxParticipants}
            onChangeText={setMaxParticipants}
            placeholder="10"
            placeholderTextColor={styles.placeholderColor.color}
            keyboardType="number-pad"
          />
          <Text style={styles.hint}>Between 2 and 50</Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            createMutation.isPending && styles.buttonDisabled,
          ]}
          onPress={handleCreate}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color={styles.buttonText.color} />
          ) : (
            <Text style={styles.buttonText}>Start Streaming</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create((theme) => ({
  flex: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize["2xl"],
    fontWeight: "700",
    color: theme.colors.foreground,
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    marginTop: -theme.spacing.md,
  },
  field: {
    gap: theme.spacing.xs,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: "500",
    color: theme.colors.foreground,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 4,
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
  },
  hint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  placeholderColor: {
    color: theme.colors.mutedForeground,
  },
  button: {
    backgroundColor: theme.colors.destructive,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    marginTop: theme.spacing.sm,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
    color: "#ffffff",
  },
}));
