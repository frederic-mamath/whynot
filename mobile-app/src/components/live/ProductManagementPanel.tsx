import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Star, StarOff, Package } from "lucide-react-native";
import { trpc } from "@/lib/trpc";

interface ProductManagementPanelProps {
  channelId: number;
  shopId: number;
  highlightedProductId: number | null;
}

export function ProductManagementPanel({
  channelId,
  shopId,
  highlightedProductId,
}: ProductManagementPanelProps) {
  const [pendingProductId, setPendingProductId] = useState<number | null>(null);

  const { data: channelProducts } = trpc.product.listByChannel.useQuery({
    channelId,
  });

  const { data: shopProducts } = trpc.product.list.useQuery({
    shopId,
    activeOnly: true,
  });

  const associateMutation = trpc.product.associateToChannel.useMutation({
    onSuccess: () => {
      utils.product.listByChannel.invalidate({ channelId });
    },
    onError: (error) => Alert.alert("Error", error.message),
  });

  const highlightMutation = trpc.channel.highlightProduct.useMutation({
    onSuccess: () => setPendingProductId(null),
    onError: (error) => {
      setPendingProductId(null);
      Alert.alert("Error", error.message);
    },
  });

  const unhighlightMutation = trpc.channel.unhighlightProduct.useMutation({
    onSuccess: () => setPendingProductId(null),
    onError: (error) => {
      setPendingProductId(null);
      Alert.alert("Error", error.message);
    },
  });

  const utils = trpc.useUtils();

  // Products already in channel
  const channelProductIds = new Set(
    (channelProducts ?? []).map((p: any) => p.id),
  );

  // Shop products not yet in channel
  const availableProducts = (shopProducts ?? []).filter(
    (p: any) => !channelProductIds.has(p.id),
  );

  const handleHighlight = (productId: number) => {
    setPendingProductId(productId);
    if (highlightedProductId === productId) {
      unhighlightMutation.mutate({ channelId });
    } else {
      highlightMutation.mutate({ channelId, productId });
    }
  };

  const handleAddProduct = (productId: number) => {
    associateMutation.mutate({ productId, channelId });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Channel Products</Text>

      {(channelProducts ?? []).length === 0 ? (
        <Text style={styles.emptyText}>No products added yet</Text>
      ) : (
        <FlatList
          data={channelProducts ?? []}
          keyExtractor={(item: any) => String(item.id)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }: { item: any }) => {
            const isHighlighted = highlightedProductId === item.id;
            const isPending = pendingProductId === item.id;

            return (
              <Pressable
                style={[
                  styles.productChip,
                  isHighlighted && styles.productChipHighlighted,
                ]}
                onPress={() => handleHighlight(item.id)}
                disabled={isPending}
              >
                {isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : isHighlighted ? (
                  <StarOff size={14} color="#fff" />
                ) : (
                  <Star size={14} color={styles.chipIcon.color} />
                )}
                <Text
                  style={[
                    styles.chipText,
                    isHighlighted && styles.chipTextHighlighted,
                  ]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </Pressable>
            );
          }}
        />
      )}

      {availableProducts.length > 0 && (
        <>
          <Text style={styles.sectionSubtitle}>Add from shop</Text>
          <FlatList
            data={availableProducts}
            keyExtractor={(item: any) => String(item.id)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }: { item: any }) => (
              <Pressable
                style={styles.addChip}
                onPress={() => handleAddProduct(item.id)}
              >
                <Package size={12} color={styles.addChipIcon.color} />
                <Text style={styles.addChipText} numberOfLines={1}>
                  + {item.name}
                </Text>
              </Pressable>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
    color: "#fff",
    paddingHorizontal: theme.spacing.md,
  },
  sectionSubtitle: {
    fontSize: theme.fontSize.xs,
    fontWeight: "500",
    color: "rgba(255,255,255,0.7)",
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  emptyText: {
    fontSize: theme.fontSize.xs,
    color: "rgba(255,255,255,0.5)",
    paddingHorizontal: theme.spacing.md,
  },
  horizontalList: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  productChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    maxWidth: 160,
  },
  productChipHighlighted: {
    backgroundColor: theme.colors.destructive,
  },
  chipIcon: {
    color: "rgba(255,255,255,0.8)",
  },
  chipText: {
    fontSize: theme.fontSize.xs,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  chipTextHighlighted: {
    color: "#fff",
    fontWeight: "700",
  },
  addChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    maxWidth: 150,
  },
  addChipIcon: {
    color: "rgba(255,255,255,0.6)",
  },
  addChipText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
  },
}));
