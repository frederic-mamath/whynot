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
  Switch,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { trpc } from "@/lib/trpc";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ErrorScreen } from "@/components/ErrorScreen";
import { ImageUploader } from "@/components/ImageUploader";

interface UploadedImage {
  url: string;
  publicId: string;
  imageId?: number;
}

export default function EditProductScreen() {
  const { id, productId: pid } = useLocalSearchParams<{
    id: string;
    productId: string;
  }>();
  const shopId = Number(id);
  const productId = Number(pid);
  const router = useRouter();
  const utils = trpc.useUtils();

  const {
    data: product,
    isLoading: productLoading,
    isError: productError,
    refetch: refetchProduct,
  } = trpc.product.get.useQuery({ productId });
  const {
    data: existingImages,
    isLoading: imagesLoading,
    isError: imagesError,
    refetch: refetchImages,
  } = trpc.product.listImages.useQuery({ productId });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description ?? "");
      setPrice(product.price != null ? String(product.price) : "");
      setIsActive(product.isActive ?? true);
    }
  }, [product]);

  useEffect(() => {
    if (existingImages) {
      setImages(
        existingImages.map((img: any) => ({
          url: img.url,
          publicId: img.cloudinaryPublicId ?? "",
          imageId: img.id,
        })),
      );
    }
  }, [existingImages]);

  const updateMutation = trpc.product.update.useMutation();
  const addImageMutation = trpc.product.addImage.useMutation();
  const removeImageMutation = trpc.product.removeImage.useMutation();
  const deleteMutation = trpc.product.delete.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate({ shopId });
      router.back();
    },
    onError: (error) => Alert.alert("Error", error.message),
  });

  const handleSave = async () => {
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
      // 1. Remove deleted images
      for (const imageId of removedImageIds) {
        await removeImageMutation.mutateAsync({ imageId });
      }

      // 2. Add new images (those without imageId)
      const newImages = images.filter((img) => !img.imageId);
      for (const img of newImages) {
        await addImageMutation.mutateAsync({
          productId,
          url: img.url,
          cloudinaryPublicId: img.publicId,
        });
      }

      // 3. Update the product
      await updateMutation.mutateAsync({
        productId,
        name: name.trim(),
        description: description.trim() || undefined,
        price: parsedPrice,
        isActive,
        imageUrl: images[0]?.url ?? undefined,
      });

      utils.product.list.invalidate({ shopId });
      utils.product.get.invalidate({ productId });
      utils.product.listImages.invalidate({ productId });
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error?.message ?? "Failed to update product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Product", "This action cannot be undone. Continue?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate({ productId }),
      },
    ]);
  };

  if (productLoading || imagesLoading) return <LoadingScreen />;
  if (productError || imagesError) {
    return (
      <ErrorScreen
        onRetry={() => {
          refetchProduct();
          refetchImages();
        }}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Stack.Screen options={{ title: "Edit Product" }} />
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

        <View style={styles.switchRow}>
          <Text style={styles.label}>Active</Text>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{
              false: styles.switchTrackOff.backgroundColor as string,
              true: styles.switchTrackOn.backgroundColor as string,
            }}
          />
        </View>

        <ImageUploader
          images={images}
          onImageAdded={(img) =>
            setImages((prev) => [...prev, { ...img, imageId: undefined }])
          }
          onImageRemoved={(index) => {
            const removed = images[index];
            if (removed?.imageId) {
              setRemovedImageIds((prev) => [...prev, removed.imageId!]);
            }
            setImages((prev) => prev.filter((_, i) => i !== index));
          }}
        />

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            submitting && styles.buttonDisabled,
          ]}
          onPress={handleSave}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={styles.buttonText.color} />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.deleteBtn,
            pressed && styles.deleteBtnPressed,
          ]}
          onPress={handleDelete}
        >
          <Text style={styles.deleteText}>Delete Product</Text>
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
    paddingBottom: theme.spacing["2xl"],
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
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchTrackOff: {
    backgroundColor: theme.colors.border,
  },
  switchTrackOn: {
    backgroundColor: theme.colors.primary,
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
  deleteBtn: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.destructive,
  },
  deleteBtnPressed: {
    opacity: 0.85,
  },
  deleteText: {
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
    color: theme.colors.destructive,
  },
}));
