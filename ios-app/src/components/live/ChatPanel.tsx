import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  Keyboard,
  InputAccessoryView,
  Platform,
} from "react-native";
import { trpc } from "@/lib/trpc";

const INPUT_ACCESSORY_ID = "chat-dismiss";

type MessageUser = {
  id: number;
  email: string;
  firstname?: string | null;
  lastname?: string | null;
};

type Message = {
  id: number;
  content: string;
  createdAt: Date | string;
  user: MessageUser;
};

function displayName(user: MessageUser): string {
  if (user.firstname) return user.firstname;
  return user.email.split("@")[0];
}

type Props = { channelId: number };

export function ChatPanel({ channelId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const listRef = useRef<FlatList>(null);

  const { data: initial } = trpc.message.list.useQuery({ channelId, limit: 50 });
  const sendMutation = trpc.message.send.useMutation();

  useEffect(() => {
    if (initial) setMessages(initial as Message[]);
  }, [initial]);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardWillShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hide = Keyboard.addListener("keyboardWillHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  trpc.message.subscribe.useSubscription(
    { channelId },
    {
      onData: (msg) => {
        setMessages((prev) => [...prev, msg as Message]);
        listRef.current?.scrollToEnd({ animated: true });
      },
    }
  );

  const send = () => {
    const content = text.trim();
    if (!content) return;
    sendMutation.mutate({ channelId, content });
    setText("");
  };

  return (
    <>
      <View style={[styles.container, { bottom: keyboardHeight }]}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => String(m.id)}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <View style={styles.messageRow}>
              <Text style={styles.name}>{displayName(item.user)} </Text>
              <Text style={styles.content}>{item.content}</Text>
            </View>
          )}
        />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Message…"
            placeholderTextColor="rgba(255,255,255,0.4)"
            onSubmitEditing={send}
            returnKeyType="send"
            blurOnSubmit={false}
            inputAccessoryViewID={Platform.OS === "ios" ? INPUT_ACCESSORY_ID : undefined}
          />
          <Pressable style={styles.sendButton} onPress={send}>
            <Text style={styles.sendText}>↑</Text>
          </Pressable>
        </View>
      </View>

      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID={INPUT_ACCESSORY_ID}>
          <View style={styles.accessory}>
            <Pressable onPress={Keyboard.dismiss} style={styles.dismissButton}>
              <Text style={styles.dismissText}>Fermer</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 260,
    paddingBottom: 12,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    justifyContent: "flex-end",
  },
  messageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  name: {
    color: "#A78BFA",
    fontSize: 13,
    fontWeight: "700",
  },
  content: {
    color: "#fff",
    fontSize: 13,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    marginTop: 6,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 38,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 14,
    color: "#fff",
    fontSize: 14,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  sendText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  accessory: {
    backgroundColor: "#1C1C1E",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "flex-end",
  },
  dismissButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dismissText: {
    color: "#A78BFA",
    fontSize: 15,
    fontWeight: "600",
  },
});
