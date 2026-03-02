import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { AlertTriangle, RotateCcw } from "lucide-react-native";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary — catches unhandled JS errors in the component tree
 * and displays a user-friendly fallback screen with a retry option.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <FallbackScreen onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

function FallbackScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.container}>
      <AlertTriangle size={48} color="#e5484d" />
      <Text style={styles.title}>Oups, quelque chose a mal tourné</Text>
      <Text style={styles.message}>
        Une erreur inattendue s'est produite. Veuillez réessayer.
      </Text>
      <Pressable style={styles.button} onPress={onRetry}>
        <RotateCcw size={18} color="#faf8f6" />
        <Text style={styles.buttonText}>Réessayer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: "700",
    color: theme.colors.foreground,
    marginTop: theme.spacing.lg,
    textAlign: "center",
  },
  message: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.sm,
    textAlign: "center",
    lineHeight: 22,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginTop: theme.spacing.xl,
  },
  buttonText: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
    color: theme.colors.primaryForeground,
  },
}));
