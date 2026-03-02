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
  Switch,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { trpc } from "@/lib/trpc";
import { ImageUploader } from "@/components/ImageUploader";

interface UploadedImage {
  url: string;
  publicId: string;
}

export default function CreateProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shopId = Number(id);
  const router = useRouter();
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const createMutation = trpc.product.create.useMutation();
  const addImageMutation = trpc.product.addImage.useMutation();

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Product name is required.");
      return;
    }

    const parsedPrice = price.trim() ? parseFloat(price) : undefined;
    if (price.trim() && (isNaN(parsedPrice!) || parsedPrice! < 0)) {
      Alert.alert("Validation", "Please enter a valid price.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create the product
      const product = await createMutation.mutateAsync({
        shopId,
        name: name.trim(),
        description: description.trim() || undefined,
        price: parsedPrice,
        imageUrl: images[0]?.url,
      });

      // 2. Link all uploaded images to the product
      for (const img of images) {
        await addImageMutation.mutateAsync({
          productId: product.id,
          url: img.url,
          cloudinaryPublicId: img.publicId,
        });
      }

      utils.product.list.invalidate({ shopId });
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error?.message ?? "Failed to create product.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Stack.Screen options={{ title: "Add Product" }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Product name"
            placeholderTextColor={styles.placeholderColor.color}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe this product..."
            placeholderTextColor={styles.placeholderColor.color}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Price (€)</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            placeholderTextColor={styles.placeholderColor.color}
            keyboardType="decimal-pad"
          />
        </View>

        <ImageUploader
          images={images}
          onImageAdded={(img) => setImages((prev) => [...prev, img])}
          onImageRemoved={(index) =>
            setImages((prev) => prev.filter((_, i) => i !== index))
          }
        />

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            submitting && styles.buttonDisabled,
          ]}
          onPress={handleCreate}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={styles.buttonText.color} />
          ) : (
            <Text style={styles.buttonText}>Create Product</Text>
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
    minHeight: 80,
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
