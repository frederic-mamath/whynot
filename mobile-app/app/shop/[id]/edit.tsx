import { useState, useEffect } from "react";
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
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { trpc } from "@/lib/trpc";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ErrorScreen } from "@/components/ErrorScreen";

export default function EditShopScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shopId = Number(id);
  const router = useRouter();
  const utils = trpc.useUtils();

  const {
    data: shop,
    isLoading,
    isError,
    refetch,
  } = trpc.shop.get.useQuery({ shopId });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (shop) {
      setName(shop.name);
      setDescription(shop.description ?? "");
    }
  }, [shop]);

  const updateMutation = trpc.shop.update.useMutation({
    onSuccess: () => {
      utils.shop.get.invalidate({ shopId });
      utils.shop.list.invalidate();
      router.back();
    },
    onError: (error) => Alert.alert("Error", error.message),
  });

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Shop name is required.");
      return;
    }
    updateMutation.mutate({
      shopId,
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  if (isLoading) return <LoadingScreen />;
  if (isError) return <ErrorScreen onRetry={refetch} />;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Stack.Screen options={{ title: "Edit Shop" }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <Text style={styles.label}>Shop Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Shop name"
            placeholderTextColor={styles.placeholderColor.color}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your shop..."
            placeholderTextColor={styles.placeholderColor.color}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            updateMutation.isPending && styles.buttonDisabled,
          ]}
          onPress={handleSave}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color={styles.buttonText.color} />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
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
  textArea: {
    minHeight: 100,
    paddingTop: theme.spacing.sm + 4,
  },
  placeholderColor: {
    color: theme.colors.mutedForeground,
  },
  button: {
    backgroundColor: theme.colors.primary,
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
    color: theme.colors.primaryForeground,
  },
}));
