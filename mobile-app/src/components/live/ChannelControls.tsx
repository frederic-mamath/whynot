import { View, Pressable } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  SwitchCamera,
  PhoneOff,
} from "lucide-react-native";

interface ChannelControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onSwitchCamera: () => void;
  onEndStream: () => void;
}

export function ChannelControls({
  isMuted,
  isVideoOff,
  onToggleMic,
  onToggleVideo,
  onSwitchCamera,
  onEndStream,
}: ChannelControlsProps) {
  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.controlBtn,
          isMuted && styles.controlBtnActive,
          pressed && styles.controlBtnPressed,
        ]}
        onPress={onToggleMic}
      >
        {isMuted ? (
          <MicOff size={22} color="#fff" />
        ) : (
          <Mic size={22} color="#fff" />
        )}
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.controlBtn,
          isVideoOff && styles.controlBtnActive,
          pressed && styles.controlBtnPressed,
        ]}
        onPress={onToggleVideo}
      >
        {isVideoOff ? (
          <VideoOff size={22} color="#fff" />
        ) : (
          <Video size={22} color="#fff" />
        )}
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.controlBtn,
          pressed && styles.controlBtnPressed,
        ]}
        onPress={onSwitchCamera}
      >
        <SwitchCamera size={22} color="#fff" />
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.endBtn,
          pressed && styles.controlBtnPressed,
        ]}
        onPress={onEndStream}
      >
        <PhoneOff size={22} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  controlBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  controlBtnActive: {
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  controlBtnPressed: {
    opacity: 0.7,
  },
  endBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.destructive,
    alignItems: "center",
    justifyContent: "center",
  },
}));
