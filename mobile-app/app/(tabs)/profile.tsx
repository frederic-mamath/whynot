import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ErrorScreen } from "@/components/ErrorScreen";

export default function ProfileScreen() {
  const { logout } = useAuth();
  const utils = trpc.useUtils();

  const {
    data: profile,
    isLoading,
    isError,
    refetch,
  } = trpc.profile.me.useQuery();
  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      utils.profile.me.invalidate();
      Alert.alert("Success", "Profile updated");
      setIsEditing(false);
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName ?? "");
      setLastName(profile.lastName ?? "");
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => logout() },
    ]);
  };

  if (isLoading) return <LoadingScreen />;
  if (isError) return <ErrorScreen onRetry={refetch} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Card */}
      <View style={styles.card}>
        <Text style={styles.email}>{profile?.email ?? "—"}</Text>

        {isEditing ? (
          <View style={styles.editForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor={styles.placeholder.color}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                placeholderTextColor={styles.placeholder.color}
              />
            </View>
            <View style={styles.editActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setIsEditing(false);
                  setFirstName(profile?.firstName ?? "");
                  setLastName(profile?.lastName ?? "");
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed && styles.savePressed,
                ]}
                onPress={handleSave}
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? (
                  <ActivityIndicator
                    color={styles.saveText.color}
                    size="small"
                  />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.viewMode}>
            <Text style={styles.name}>
              {[profile?.firstName, profile?.lastName]
                .filter(Boolean)
                .join(" ") || "No name set"}
            </Text>
            <Pressable
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Logout */}
      <Pressable
        style={({ pressed }) => [
          styles.logoutButton,
          pressed && styles.logoutPressed,
        ]}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing["2xl"],
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  email: {
    fontSize: theme.fontSize.lg,
    fontWeight: "600",
    color: theme.colors.foreground,
    marginBottom: theme.spacing.md,
  },
  viewMode: {
    gap: theme.spacing.md,
  },
  name: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },
  editButton: {
    alignSelf: "flex-start",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
  },
  editButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: "500",
    color: theme.colors.foreground,
  },
  editForm: {
    gap: theme.spacing.md,
  },
  inputGroup: {
    gap: theme.spacing.xs,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: "500",
    color: theme.colors.foreground,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.input,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
  },
  placeholder: {
    color: theme.colors.mutedForeground,
  },
  editActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
  },
  cancelText: {
    fontSize: theme.fontSize.sm,
    fontWeight: "500",
    color: theme.colors.mutedForeground,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
  },
  savePressed: {
    opacity: 0.85,
  },
  saveText: {
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
    color: theme.colors.primaryForeground,
  },
  logoutButton: {
    backgroundColor: theme.colors.destructive,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutPressed: {
    opacity: 0.85,
  },
  logoutText: {
    color: "#ffffff",
    fontSize: theme.fontSize.base,
    fontWeight: "600",
  },
}));
