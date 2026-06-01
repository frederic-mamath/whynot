import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, ImagePlus, Trash2 } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { trpc } from "@/lib/trpc";
import { Colors, Spacing, Radius, Typography } from "@/theme/tokens";

export default function SellerProductEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);
  const router = useRouter();
  const utils = trpc.useUtils();

  const shopQuery = trpc.shop.getOrCreateMyShop.useQuery();
  const shopId = shopQuery.data?.id;

  const productQuery = trpc.product.get.useQuery({ productId });

  const [name, setName] = useState("");
  const [wishedPrice, setWishedPrice] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productQuery.data) {
      setName(productQuery.data.name);
      setWishedPrice(productQuery.data.wishedPrice?.toString() ?? "");
      setStartingPrice(productQuery.data.startingPrice?.toString() ?? "");
      setDescription(productQuery.data.description ?? "");
      setImageUri(productQuery.data.imageUrl ?? null);
    }
  }, [productQuery.data]);

  const updateMutation = trpc.product.update.useMutation();
  const uploadMutation = trpc.image.upload.useMutation();
  const deleteMutation = trpc.product.delete.useMutation();

  const toggleActiveMutation = trpc.product.update.useMutation({
    onMutate: async (input) => {
      if (shopId === undefined) return;
      await utils.product.list.cancel({ shopId });
      const previous = utils.product.list.getData({ shopId });
      utils.product.list.setData({ shopId }, (old) =>
        old?.map((p) =>
          p.id === input.productId
            ? { ...p, isActive: input.isActive ?? p.isActive }
            : p,
        ),
      );
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (shopId !== undefined && ctx?.previous) {
        utils.product.list.setData({ shopId }, ctx.previous);
      }
    },
    onSettled: () => {
      if (shopId !== undefined) utils.product.list.invalidate({ shopId });
    },
  });

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

  const handleSave = async () => {
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Le nom est obligatoire");
      return;
    }

    const parsedWished = wishedPrice.trim()
      ? parseFloat(wishedPrice.replace(",", "."))
      : undefined;
    const parsedStarting = startingPrice.trim()
      ? parseFloat(startingPrice.replace(",", "."))
      : undefined;

    try {
      let newImageUrl: string | undefined;
      if (imageBase64) {
        const uploaded = await uploadMutation.mutateAsync({
          base64: imageBase64,
        });
        newImageUrl = uploaded.url;
      }

      await updateMutation.mutateAsync({
        productId,
        name: trimmedName,
        wishedPrice: parsedWished,
        startingPrice: parsedStarting,
        description: description.trim() || undefined,
        ...(newImageUrl ? { imageUrl: newImageUrl } : {}),
      });

      if (shopId !== undefined) {
        await utils.product.list.invalidate({ shopId });
      }
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Supprimer ce produit",
      "Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            if (shopId !== undefined) {
              utils.product.list.setData({ shopId }, (old) =>
                old?.filter((p) => p.id !== productId),
              );
            }
            try {
              await deleteMutation.mutateAsync({ productId });
              if (shopId !== undefined) {
                utils.product.list.invalidate({ shopId });
              }
              router.back();
            } catch {
              if (shopId !== undefined) {
                utils.product.list.invalidate({ shopId });
              }
            }
          },
        },
      ],
    );
  };

  if (productQuery.isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const isSaving = updateMutation.isPending || uploadMutation.isPending;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <ChevronLeft size={24} color={Colors.foreground} />
        </Pressable>
        <Text style={styles.title}>Modifier le produit</Text>
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

          <View style={styles.activeRow}>
            <Text style={styles.activeLabel}>Produit actif</Text>
            <Switch
              value={productQuery.data?.isActive ?? false}
              onValueChange={(value) =>
                toggleActiveMutation.mutate({ productId, isActive: value })
              }
            />
          </View>

          <Field label="Nom *">
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
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
              isSaving && styles.submitDisabled,
            ]}
            disabled={isSaving}
            onPress={handleSave}
          >
            {isSaving ? (
              <ActivityIndicator color={Colors.primaryForeground} />
            ) : (
              <Text style={styles.submitText}>Enregistrer</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.deleteBtn,
              pressed && styles.deleteBtnPressed,
            ]}
            onPress={handleDelete}
          >
            <Trash2 size={18} color={Colors.destructive} />
            <Text style={styles.deleteText}>Supprimer le produit</Text>
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
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
  activeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.foreground,
  },
  field: { gap: Spacing.xs },
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
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  deleteBtnPressed: { opacity: 0.6 },
  deleteText: {
    color: Colors.destructive,
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
  },
});
