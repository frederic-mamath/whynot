/* eslint-disable @typescript-eslint/no-floating-promises, max-lines -- TODO: floating-promises removed by ticket-006; max-lines removed by ticket-011 */
import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  Image,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { X, Radio, Tag, Plus, Square } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import {
  isAgoraAvailable,
  initializeBroadcaster,
  joinChannelAsBroadcaster,
  stopBroadcaster,
  RtcLocalView,
} from "@/lib/agora";
import { ChatPanel } from "@/components/live/ChatPanel";
import { AuctionCountdown } from "@/components/live/AuctionCountdown";
import { Colors, Spacing, Radius, Typography } from "@/theme/tokens";

type ChannelData = { id: number };

const DURATION_PRESETS: ReadonlyArray<{
  label: string;
  value: 60 | 300 | 600 | 1800;
}> = [
  { label: "1 min", value: 60 },
  { label: "5 min", value: 300 },
  { label: "10 min", value: 600 },
  { label: "30 min", value: 1800 },
];

export default function SellerGoLiveScreen() {
  const { liveId } = useLocalSearchParams<{ liveId: string }>();
  const channelId = Number(liveId);
  const router = useRouter();
  const { user: _user } = useAuth();

  const [hasInitialized, setHasInitialized] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [joinData, setJoinData] = useState<{
    token: string;
    appId: string;
    uid: number;
    channel: ChannelData;
  } | null>(null);
  const [sheet, setSheet] = useState<"highlight" | "auction" | null>(null);
  const [participantCount, setParticipantCount] = useState(0);

  const startMutation = trpc.live.start.useMutation();
  const endMutation = trpc.live.end.useMutation();
  const highlightMutation = trpc.live.highlightProduct.useMutation();
  const unhighlightMutation = trpc.live.unhighlightProduct.useMutation();
  const startAuctionMutation = trpc.auction.start.useMutation();
  const closeAuctionMutation = trpc.auction.close.useMutation();

  const productsQuery = trpc.product.listByChannel.useQuery({ channelId });
  const activeAuctionQuery = trpc.auction.getActive.useQuery(
    { channelId },
    { refetchInterval: isBroadcasting ? 2000 : false },
  );
  const liveGetQuery = trpc.live.get.useQuery({ channelId });

  const utils = trpc.useUtils();

  const [highlightedProductId, setHighlightedProductId] = useState<
    number | null
  >(liveGetQuery.data?.channel?.highlighted_product_id ?? null);

  useEffect(() => {
    if (liveGetQuery.data?.channel) {
      setHighlightedProductId(
        liveGetQuery.data.channel.highlighted_product_id ?? null,
      );
    }
  }, [liveGetQuery.data?.channel]);

  trpc.live.subscribeToEvents.useSubscription(
    { channelId },
    {
      enabled: isBroadcasting,
      onData: (event) => {
        const e = event as {
          type: string;
          product?: { id: number };
          participantCount?: number;
        };
        if (e.type === "PRODUCT_HIGHLIGHTED" && e.product) {
          setHighlightedProductId(e.product.id);
        } else if (e.type === "PRODUCT_UNHIGHLIGHTED") {
          setHighlightedProductId(null);
        } else if (e.type === "PARTICIPANT_COUNT_CHANGED" && typeof e.participantCount === "number") {
          setParticipantCount(e.participantCount);
        } else if (e.type === "auction:bid") {
          utils.auction.getActive.invalidate({ channelId });
        } else if (e.type === "auction:ended") {
          utils.auction.getActive.invalidate({ channelId });
        }
      },
    },
  );

  const initializingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    if (initializingRef.current) return;
    initializingRef.current = true;

    (async () => {
      try {
        const data = await startMutation.mutateAsync({ channelId });
        if (cancelled) return;
        setJoinData({
          token: data.token,
          appId: data.appId,
          uid: data.uid,
          channel: data.channel,
        });
        if (isAgoraAvailable) {
          await initializeBroadcaster(data.appId);
          setHasInitialized(true);
        }
      } catch (e) {
        Alert.alert(
          "Erreur",
          e instanceof Error ? e.message : "Impossible d'initialiser le live",
        );
        router.back();
      }
    })();

    return () => {
      cancelled = true;
      stopBroadcaster().catch(() => {});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: removed by ticket-007 (useAgoraSession)
  }, [channelId]);

  const handleStartBroadcast = async () => {
    if (!joinData) return;
    try {
      await joinChannelAsBroadcaster(
        joinData.token,
        joinData.channel.id.toString(),
        joinData.uid,
      );
      setIsBroadcasting(true);
    } catch (e) {
      Alert.alert(
        "Erreur",
        e instanceof Error ? e.message : "Impossible de démarrer la diffusion",
      );
    }
  };

  const handleEndLive = () => {
    Alert.alert(
      "Terminer le live",
      "La diffusion sera arrêtée et le live marqué comme terminé.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Terminer",
          style: "destructive",
          onPress: async () => {
            try {
              await endMutation.mutateAsync({ channelId });
            } catch {
              // Server may have already ended; carry on
            }
            await stopBroadcaster().catch(() => {});
            router.back();
          },
        },
      ],
    );
  };

  const handleLeave = async () => {
    await stopBroadcaster().catch(() => {});
    router.back();
  };

  const handleHighlightProduct = async (productId: number) => {
    setSheet(null);
    setHighlightedProductId(productId);
    try {
      await highlightMutation.mutateAsync({ channelId, productId });
    } catch (e) {
      setHighlightedProductId(null);
      Alert.alert(
        "Erreur",
        e instanceof Error ? e.message : "Impossible de mettre en avant",
      );
    }
  };

  const handleUnhighlight = async () => {
    setHighlightedProductId(null);
    try {
      await unhighlightMutation.mutateAsync({ channelId });
    } catch {
      // ignore
    }
  };

  const handleCloseAuction = async () => {
    const auction = activeAuctionQuery.data;
    if (!auction) return;
    try {
      await closeAuctionMutation.mutateAsync({ auctionId: auction.id });
      utils.auction.getActive.invalidate({ channelId });
    } catch (e) {
      Alert.alert(
        "Erreur",
        e instanceof Error ? e.message : "Impossible de terminer l'enchère",
      );
    }
  };

  const products = productsQuery.data ?? [];
  const highlightedProduct = products.find(
    (p) => p.id === highlightedProductId,
  );
  const activeAuction = activeAuctionQuery.data;

  return (
    <View style={styles.container}>
      {isAgoraAvailable && RtcLocalView && hasInitialized && (
        <RtcLocalView style={StyleSheet.absoluteFill} />
      )}
      {!isAgoraAvailable && (
        <View style={styles.cameraFallback}>
          <Text style={styles.cameraFallbackText}>
            Caméra indisponible sur cet appareil
          </Text>
        </View>
      )}

      <SafeAreaView style={styles.topBar}>
        <View style={styles.topBarRow}>
          <Pressable
            onPress={isBroadcasting ? handleLeave : () => router.back()}
            style={styles.iconBtn}
          >
            <X size={22} color={Colors.foreground} />
          </Pressable>
          {isBroadcasting && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>LIVE</Text>
              <Text style={styles.viewerCount}>· {participantCount}</Text>
            </View>
          )}
          <View style={styles.iconBtn} />
        </View>
      </SafeAreaView>

      {highlightedProduct && (
        <View style={styles.highlightedBanner}>
          <Tag size={14} color={Colors.foreground} />
          <Text style={styles.highlightedName} numberOfLines={1}>
            {highlightedProduct.name}
          </Text>
          <Pressable onPress={handleUnhighlight} hitSlop={8}>
            <X size={16} color={Colors.foreground} />
          </Pressable>
        </View>
      )}

      {activeAuction && (
        <View style={styles.auctionPanel}>
          <View style={styles.auctionRow}>
            <Text style={styles.auctionLabel}>Enchère en cours</Text>
            <AuctionCountdown endsAt={activeAuction.endsAt} />
          </View>
          <Text style={styles.auctionBid}>
            {activeAuction.currentBid.toFixed(2)} €
            {activeAuction.highestBidderUsername
              ? `  ·  ${activeAuction.highestBidderUsername}`
              : ""}
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.endAuctionBtn,
              pressed && styles.pressed,
            ]}
            onPress={handleCloseAuction}
          >
            <Square size={14} color={Colors.destructiveForeground} />
            <Text style={styles.endAuctionText}>Terminer l'enchère</Text>
          </Pressable>
        </View>
      )}

      {isBroadcasting && (
        <View style={styles.chatWrap}>
          <ChatPanel channelId={channelId} />
        </View>
      )}

      <SafeAreaView style={styles.bottomBar}>
        {!isBroadcasting ? (
          <View style={styles.startWrap}>
            <Pressable
              style={({ pressed }) => [
                styles.startBtn,
                pressed && styles.pressed,
                (!joinData || startMutation.isPending) && styles.startBtnDisabled,
              ]}
              onPress={handleStartBroadcast}
              disabled={!joinData || startMutation.isPending}
            >
              {startMutation.isPending || !joinData ? (
                <ActivityIndicator color={Colors.destructiveForeground} />
              ) : (
                <>
                  <Radio size={20} color={Colors.destructiveForeground} />
                  <Text style={styles.startBtnText}>Démarrer le live</Text>
                </>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={styles.controlsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.controlBtn,
                pressed && styles.pressed,
              ]}
              onPress={() => setSheet("highlight")}
            >
              <Tag size={20} color={Colors.foreground} />
              <Text style={styles.controlBtnText}>Produit</Text>
            </Pressable>
            {highlightedProduct && !activeAuction && (
              <Pressable
                style={({ pressed }) => [
                  styles.auctionBtn,
                  pressed && styles.pressed,
                ]}
                onPress={() => setSheet("auction")}
              >
                <Plus size={20} color={Colors.primaryForeground} />
                <Text style={styles.controlBtnText}>Enchère</Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.terminateBtn,
                pressed && styles.pressed,
              ]}
              onPress={handleEndLive}
            >
              <Square size={20} color={Colors.destructive} />
              <Text style={[styles.controlBtnText, styles.terminateBtnText]}>Terminer</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>

      <HighlightSheet
        visible={sheet === "highlight"}
        onClose={() => setSheet(null)}
        products={products}
        highlightedId={highlightedProductId}
        onSelect={handleHighlightProduct}
      />

      <AuctionSheet
        visible={sheet === "auction"}
        onClose={() => setSheet(null)}
        product={highlightedProduct}
        onSubmit={async (durationSeconds, buyoutPrice) => {
          if (!highlightedProduct) return;
          try {
            await startAuctionMutation.mutateAsync({
              productId: highlightedProduct.id,
              durationSeconds,
              buyoutPrice,
            });
            setSheet(null);
            utils.auction.getActive.invalidate({ channelId });
          } catch (e) {
            Alert.alert(
              "Erreur",
              e instanceof Error ? e.message : "Impossible de lancer l'enchère",
            );
          }
        }}
        isSubmitting={startAuctionMutation.isPending}
      />
    </View>
  );
}

function HighlightSheet({
  visible,
  onClose,
  products,
  highlightedId,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  products: Array<{ id: number; name: string; imageUrl: string | null }>;
  highlightedId: number | null;
  onSelect: (productId: number) => void;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.sheetSafe}>
        <View style={styles.sheetHeader}>
          <Pressable onPress={onClose} style={styles.sheetIconBtn}>
            <X size={24} color={Colors.foreground} />
          </Pressable>
          <Text style={styles.sheetTitle}>Mettre un produit en avant</Text>
          <View style={styles.sheetIconBtn} />
        </View>
        <ScrollView contentContainerStyle={styles.sheetList}>
          {products.length === 0 ? (
            <Text style={styles.sheetEmpty}>
              Aucun produit attaché à ce live
            </Text>
          ) : (
            products.map((p) => (
              <Pressable
                key={p.id}
                style={({ pressed }) => [
                  styles.sheetRow,
                  highlightedId === p.id && styles.sheetRowActive,
                  pressed && styles.pressed,
                ]}
                onPress={() => onSelect(p.id)}
              >
                {p.imageUrl ? (
                  <Image
                    source={{ uri: p.imageUrl }}
                    style={styles.sheetThumb}
                  />
                ) : (
                  <View style={[styles.sheetThumb, styles.thumbFallback]} />
                )}
                <Text style={styles.sheetRowName} numberOfLines={1}>
                  {p.name}
                </Text>
                {highlightedId === p.id && (
                  <Text style={styles.sheetRowActiveLabel}>En avant</Text>
                )}
              </Pressable>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function AuctionSheet({
  visible,
  onClose,
  product,
  onSubmit,
  isSubmitting,
}: {
  visible: boolean;
  onClose: () => void;
  product?: { id: number; name: string; price?: number | null; imageUrl?: string | null };
  onSubmit: (
    durationSeconds: 60 | 300 | 600 | 1800,
    buyoutPrice: number | undefined,
  ) => Promise<void>;
  isSubmitting: boolean;
}) {
  const [duration, setDuration] = useState<60 | 300 | 600 | 1800>(60);
  const [buyout, setBuyout] = useState("");

  useEffect(() => {
    if (visible) {
      setDuration(60);
      setBuyout("");
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.sheetSafe}>
        <View style={styles.sheetHeader}>
          <Pressable onPress={onClose} style={styles.sheetIconBtn}>
            <X size={24} color={Colors.foreground} />
          </Pressable>
          <Text style={styles.sheetTitle}>Lancer une enchère</Text>
          <View style={styles.sheetIconBtn} />
        </View>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView contentContainerStyle={styles.sheetContent}>
            {product && (
              <View style={styles.productSummary}>
                <View style={styles.productSummaryRow}>
                  {product.imageUrl ? (
                    <Image
                      source={{ uri: product.imageUrl }}
                      style={styles.sheetThumb}
                    />
                  ) : (
                    <View style={[styles.sheetThumb, styles.thumbFallback]} />
                  )}
                  <View style={styles.productSummaryInfo}>
                    <Text style={styles.productSummaryName}>{product.name}</Text>
                    {product.price != null && (
                      <Text style={styles.productSummaryPrice}>
                        Prix de départ : {product.price.toFixed(2)} €
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            <Text style={styles.fieldLabel}>Durée</Text>
            <View style={styles.chipsRow}>
              {DURATION_PRESETS.map((p) => (
                <Pressable
                  key={p.value}
                  style={({ pressed }) => [
                    styles.chip,
                    duration === p.value && styles.chipActive,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => setDuration(p.value)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      duration === p.value && styles.chipTextActive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Prix d'achat immédiat (optionnel)</Text>
            <TextInput
              style={styles.input}
              value={buyout}
              onChangeText={setBuyout}
              placeholder="Ex: 50.00"
              placeholderTextColor={Colors.inputHint}
              keyboardType="decimal-pad"
            />

            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && styles.pressed,
                isSubmitting && styles.startBtnDisabled,
              ]}
              disabled={isSubmitting}
              onPress={() => {
                const parsed = buyout.trim()
                  ? parseFloat(buyout.replace(",", "."))
                  : undefined;
                onSubmit(duration, parsed);
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.primaryForeground} />
              ) : (
                <Text style={styles.submitBtnText}>Lancer l'enchère</Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  cameraFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  cameraFallbackText: {
    color: Colors.mutedForeground,
    fontSize: 14,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.destructive,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.destructiveForeground,
  },
  liveBadgeText: {
    color: Colors.destructiveForeground,
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  viewerCount: {
    color: Colors.foreground,
    fontSize: 12,
    fontWeight: "600",
  },
  highlightedBanner: {
    position: "absolute",
    top: 110,
    left: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    zIndex: 5,
  },
  highlightedName: {
    flex: 1,
    color: Colors.foreground,
    fontWeight: "600",
    fontSize: 14,
  },
  auctionPanel: {
    position: "absolute",
    top: 165,
    left: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    zIndex: 5,
  },
  auctionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  auctionLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  auctionBid: {
    color: Colors.foreground,
    fontSize: 22,
    fontWeight: "700",
  },
  endAuctionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.destructive,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  endAuctionText: {
    color: Colors.destructiveForeground,
    fontWeight: "600",
    fontSize: 14,
  },
  chatWrap: {
    position: "absolute",
    bottom: 90,
    left: 0,
    right: 0,
    height: 280,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  startWrap: {
    alignItems: "center",
    paddingBottom: Spacing.xl,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.destructive,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: 999,
  },
  startBtnDisabled: { opacity: 0.5 },
  startBtnText: {
    color: Colors.destructiveForeground,
    fontSize: 16,
    fontWeight: "700",
  },
  controlsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "center",
  },
  controlBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  auctionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  controlBtnText: {
    color: Colors.foreground,
    fontWeight: "600",
    fontSize: 14,
  },
  pressed: { opacity: 0.7 },
  sheetSafe: { flex: 1, backgroundColor: Colors.background },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  sheetIconBtn: { width: 32, alignItems: "center" },
  sheetTitle: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.foreground,
  },
  sheetList: { padding: Spacing.lg, gap: Spacing.sm },
  sheetEmpty: {
    color: Colors.mutedForeground,
    textAlign: "center",
    paddingVertical: Spacing.xl,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sheetRowActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.accent,
  },
  sheetThumb: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
  },
  thumbFallback: { backgroundColor: Colors.muted },
  sheetRowName: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.foreground,
    fontWeight: "500",
  },
  sheetRowActiveLabel: {
    color: Colors.primary,
    fontWeight: "600",
    fontSize: Typography.fontSize.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sheetContent: { padding: Spacing.lg, gap: Spacing.md },
  productSummary: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  productSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  productSummaryInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  productSummaryName: {
    fontSize: Typography.fontSize.base,
    fontWeight: "600",
    color: Colors.foreground,
  },
  productSummaryPrice: {
    fontSize: Typography.fontSize.sm,
    color: Colors.mutedForeground,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    color: Colors.foreground,
    marginTop: Spacing.sm,
  },
  chipsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.input,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.foreground,
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
  },
  chipTextActive: {
    color: Colors.primaryForeground,
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
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  submitBtnText: {
    color: Colors.primaryForeground,
    fontSize: Typography.fontSize.base,
    fontWeight: "700",
  },
  terminateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.destructive,
  },
  terminateBtnText: {
    color: Colors.destructive,
  },
});
