import { OAuth2Client } from "google-auth-library";
import { createRemoteJWKSet, jwtVerify } from "jose";

export type GoogleIdTokenPayload = {
  providerId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export type AppleIdTokenPayload = {
  providerId: string;
  email: string;
};

const APPLE_JWKS_URL = new URL("https://appleid.apple.com/auth/keys");
const APPLE_ISSUER = "https://appleid.apple.com";

export class MobileOAuthService {
  private googleClient: OAuth2Client | null = null;
  private appleJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

  private getGoogleClient(): OAuth2Client {
    if (!this.googleClient) {
      this.googleClient = new OAuth2Client();
    }
    return this.googleClient;
  }

  private getAppleJwks() {
    if (!this.appleJwks) {
      this.appleJwks = createRemoteJWKSet(APPLE_JWKS_URL);
    }
    return this.appleJwks;
  }

  private getGoogleAudiences(): string[] {
    const audiences = [
      process.env.GOOGLE_IOS_CLIENT_ID,
      process.env.GOOGLE_ANDROID_CLIENT_ID,
      process.env.GOOGLE_WEB_CLIENT_ID,
    ].filter((v): v is string => typeof v === "string" && v.length > 0);
    if (audiences.length === 0) {
      throw new Error(
        "At least one of GOOGLE_IOS_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID, GOOGLE_WEB_CLIENT_ID must be set",
      );
    }
    return audiences;
  }

  private getAppleAudience(): string {
    const bundleId = process.env.APPLE_BUNDLE_ID;
    if (!bundleId) {
      throw new Error("APPLE_BUNDLE_ID environment variable is required");
    }
    return bundleId;
  }

  async verifyGoogleIdToken(idToken: string): Promise<GoogleIdTokenPayload> {
    const ticket = await this.getGoogleClient().verifyIdToken({
      idToken,
      audience: this.getGoogleAudiences(),
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload?.email) {
      throw new Error("Google ID token payload missing sub or email");
    }
    return {
      providerId: payload.sub,
      email: payload.email,
      firstName: payload.given_name ?? null,
      lastName: payload.family_name ?? null,
    };
  }

  async verifyAppleIdToken(idToken: string): Promise<AppleIdTokenPayload> {
    const { payload } = await jwtVerify(idToken, this.getAppleJwks(), {
      issuer: APPLE_ISSUER,
      audience: this.getAppleAudience(),
    });
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
      throw new Error("Apple ID token payload missing sub or email");
    }
    return {
      providerId: payload.sub,
      email: payload.email,
    };
  }
}

export const mobileOAuthService = new MobileOAuthService();
