import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Send } from "lucide-react-native";
import { trpc } from "@/lib/trpc";

interface Message {
  id: number;
  content: string;
  userId: number;
  createdAt: string;
  user: {
    id: number;
    email: string;
    firstname: string | null;
    lastname: string | null;
  };
}

interface ChatPanelProps {
  channelId: number;
}

export function ChatPanel({ channelId }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList>(null);

  // Load initial messages
  const { data: initialMessages } = trpc.message.list.useQuery({
    channelId,
    limit: 50,
  });

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages as Message[]);
    }
  }, [initialMessages]);

  // Subscribe to new messages via WebSocket
  trpc.message.subscribe.useSubscription(
    { channelId },
    {
      onData: (data: any) => {
        setMessages((prev) => [...prev, data as Message]);
        // Auto-scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
    },
  );

  // Send message mutation
  const sendMessage = trpc.message.send.useMutation({
    onSuccess: () => {
      setInput("");
    },
  });

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendMessage.mutate({ channelId, content: trimmed });
  };

  const getDisplayName = (user: Message["user"]) => {
    if (user.firstname || user.lastname) {
      return [user.firstname, user.lastname].filter(Boolean).join(" ");
    }
    return user.email.split("@")[0];
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.messageBubble}>
            <Text style={styles.messageAuthor}>
              {getDisplayName(item.user)}
            </Text>
            <Text style={styles.messageContent}>{item.content}</Text>
          </View>
        )}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Say something..."
          placeholderTextColor="rgba(255,255,255,0.5)"
          returnKeyType="send"
          onSubmitEditing={handleSend}
          maxLength={500}
        />
        <Pressable
          style={({ pressed }) => [
            styles.sendButton,
            pressed && styles.sendPressed,
          ]}
          onPress={handleSend}
          disabled={!input.trim() || sendMessage.isPending}
        >
          <Send size={18} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create((_theme) => ({
  container: {
    maxHeight: 300,
  },
  messageList: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  messageBubble: {
    marginBottom: 6,
  },
  messageAuthor: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 1,
  },
  messageContent: {
    color: "#ffffff",
    fontSize: 14,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: "#ffffff",
    fontSize: 14,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  sendPressed: {
    opacity: 0.7,
  },
}));
