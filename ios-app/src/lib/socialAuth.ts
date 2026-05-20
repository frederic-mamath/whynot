import { Platform } from "react-native";
import Constants from "expo-constants";
import * as AppleAuthentication from "expo-apple-authentication";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

export class SocialAuthCanceledError extends Error {
  constructor() {
    super("Social auth canceled by user");
    this.name = "SocialAuthCanceledError";
  }
}

export type AppleAuthResult = {
  identityToken: string;
  firstName: string | null;
  lastName: string | null;
};

export type GoogleAuthResult = {
  idToken: string;
};

let googleConfigured = false;

function configureGoogleOnce() {
  if (googleConfigured) return;
  const extra = Constants.expoConfig?.extra ?? {};
  GoogleSignin.configure({
    iosClientId: (extra.googleIosClientId as string) || undefined,
    webClientId: (extra.googleWebClientId as string) || undefined,
  });
  googleConfigured = true;
}

export async function signInWithApple(): Promise<AppleAuthResult> {
  if (Platform.OS !== "ios") {
    throw new Error("Apple sign-in is only available on iOS");
  }
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) {
      throw new Error("Apple did not return an identity token");
    }
    return {
      identityToken: credential.identityToken,
      firstName: credential.fullName?.givenName ?? null,
      lastName: credential.fullName?.familyName ?? null,
    };
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "ERR_REQUEST_CANCELED"
    ) {
      throw new SocialAuthCanceledError();
    }
    throw err;
  }
}

export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  configureGoogleOnce();
  if (Platform.OS === "android") {
    await GoogleSignin.hasPlayServices();
  }
  const response = await GoogleSignin.signIn();
  if (response.type === "cancelled") {
    throw new SocialAuthCanceledError();
  }
  if (response.type !== "success" || !response.data.idToken) {
    throw new Error("Google did not return an idToken");
  }
  return { idToken: response.data.idToken };
}
