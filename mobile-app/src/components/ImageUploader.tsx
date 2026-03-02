import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import * as ImagePicker from "expo-image-picker";
import { Camera, ImagePlus, X } from "lucide-react-native";
import { trpc } from "@/lib/trpc";

interface UploadedImage {
  url: string;
  publicId: string;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onImageAdded: (image: UploadedImage) => void;
  onImageRemoved: (index: number) => void;
  maxImages?: number;
}

export function ImageUploader({
  images,
  onImageAdded,
  onImageRemoved,
  maxImages = 5,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const uploadMutation = trpc.image.upload.useMutation();

  const pickImage = async (useCamera: boolean) => {
    const permissionMethod = useCamera
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;

    const { status } = await permissionMethod();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        `Please grant ${useCamera ? "camera" : "photo library"} access to upload images.`,
      );
      return;
    }

    const launchMethod = useCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const result = await launchMethod({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets[0]?.base64) return;

    setUploading(true);
    try {
      const { url, publicId } = await uploadMutation.mutateAsync({
        base64: `data:image/jpeg;base64,${result.assets[0].base64}`,
      });
      onImageAdded({ url, publicId });
    } catch (error: any) {
      Alert.alert("Upload failed", error?.message ?? "Could not upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddPress = () => {
    Alert.alert("Add Image", "Choose a source", [
      { text: "Camera", onPress: () => pickImage(true) },
      { text: "Photo Library", onPress: () => pickImage(false) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const canAddMore = images.length < maxImages;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Images ({images.length}/{maxImages})
      </Text>

      <View style={styles.grid}>
        {images.map((img, index) => (
          <View key={img.url} style={styles.imageWrapper}>
            <Image source={{ uri: img.url }} style={styles.image} />
            <Pressable
              style={styles.removeButton}
              onPress={() => onImageRemoved(index)}
            >
              <X size={14} color="#fff" />
            </Pressable>
            {index === 0 && (
              <View style={styles.mainBadge}>
                <Text style={styles.mainBadgeText}>Main</Text>
              </View>
            )}
          </View>
        ))}

        {canAddMore && (
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
            onPress={handleAddPress}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color={styles.addIcon.color} />
            ) : (
              <>
                <ImagePlus size={24} color={styles.addIcon.color} />
                <Text style={styles.addText}>Add</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: theme.spacing.sm,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: "500",
    color: theme.colors.foreground,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  imageWrapper: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.md,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: theme.colors.secondary,
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  mainBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 2,
    alignItems: "center",
  },
  mainBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  addButton: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addButtonPressed: {
    opacity: 0.7,
  },
  addIcon: {
    color: theme.colors.mutedForeground,
  },
  addText: {
    fontSize: 11,
    color: theme.colors.mutedForeground,
  },
}));
