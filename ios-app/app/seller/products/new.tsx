import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, ImagePlus } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { trpc } from "@/lib/trpc";
import { Colors, Spacing, Radius, Typography } from "@/theme/tokens";

export default function SellerProductNewScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const shopQuery = trpc.shop.getOrCreateMyShop.useQuery();
  const shopId = shopQuery.data?.id;

  const [name, setName] = useState("");
  const [wishedPrice, setWishedPrice] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createMutation = trpc.product.create.useMutation();
  const uploadMutation = trpc.image.upload.useMutation();
  const addImageMutation = trpc.product.addImage.useMutation();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Le nom est obligatoire");
      return;
    }
    if (!shopId) return;

    const parsedWished = wishedPrice.trim()
      ? parseFloat(wishedPrice.replace(",", "."))
      : undefined;
    const parsedStarting = startingPrice.trim()
      ? parseFloat(startingPrice.replace(",", "."))
      : undefined;

    try {
      const product = await createMutation.mutateAsync({
        shopId,
        name: trimmedName,
        wishedPrice: parsedWished,
        startingPrice: parsedStarting,
        description: description.trim() || undefined,
      });

      if (imageBase64) {
        const uploaded = await uploadMutation.mutateAsync({
          base64: imageBase64,
        });
        await addImageMutation.mutateAsync({
          productId: product.id,
          url: uploaded.url,
          cloudinaryPublicId: uploaded.publicId,
        });
      }

      await utils.product.list.invalidate({ shopId });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la création");
    }
  };

  const isSubmitting =
    createMutation.isPending ||
    uploadMutation.isPending ||
    addImageMutation.isPending;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <ChevronLeft size={24} color={Colors.foreground} />
        </Pressable>
        <Text style={styles.title}>Nouveau produit</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Pressable onPress={pickImage} style={styles.imageBox}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <ImagePlus size={32} color={Colors.mutedForeground} />
                <Text style={styles.imageHint}>Ajouter une photo</Text>
              </View>
            )}
          </Pressable>

          <Field label="Nom *">
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Veste vintage"
              placeholderTextColor={Colors.inputHint}
            />
          </Field>

          <Field label="Prix souhaité (€)">
            <TextInput
              style={styles.input}
              value={wishedPrice}
              onChangeText={setWishedPrice}
              placeholder="0.00"
              placeholderTextColor={Colors.inputHint}
              keyboardType="decimal-pad"
            />
          </Field>

          <Field label="Prix de départ d'enchère (€)">
            <TextInput
              style={styles.input}
              value={startingPrice}
              onChangeText={setStartingPrice}
              placeholder="0.00"
              placeholderTextColor={Colors.inputHint}
              keyboardType="decimal-pad"
            />
          </Field>

          <Field label="Description">
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Détails sur l'article"
              placeholderTextColor={Colors.inputHint}
              multiline
              numberOfLines={4}
            />
          </Field>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={({ pressed }) => [
              styles.submit,
              pressed && styles.submitPressed,
              isSubmitting && styles.submitDisabled,
            ]}
            disabled={isSubmitting}
            onPress={handleSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Colors.primaryForeground} />
            ) : (
              <Text style={styles.submitText}>Créer le produit</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  back: { padding: Spacing.xs },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
    color: Colors.foreground,
  },
  container: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  imageBox: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: Radius.lg,
    overflow: "hidden",
    backgroundColor: Colors.muted,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  imageHint: {
    color: Colors.mutedForeground,
    fontSize: Typography.fontSize.sm,
  },
  field: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.foreground,
  },
  input: {
    backgroundColor: Colors.input,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.foreground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  error: {
    color: Colors.destructive,
    fontSize: Typography.fontSize.sm,
  },
  submit: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  submitPressed: { opacity: 0.85 },
  submitDisabled: { opacity: 0.6 },
  submitText: {
    color: Colors.primaryForeground,
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
  },
});
