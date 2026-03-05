import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import AppleStrategy from "passport-apple";
import jwt from "jsonwebtoken";
import { userRepository, authProviderRepository } from "../repositories";

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await userRepository.findById(id);
    done(null, user || false);
  } catch (err) {
    done(err);
  }
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback",
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email provided by Google"));
          }

          const providerId = profile.id;
          const firstName = profile.name?.givenName || null;
          const lastName = profile.name?.familyName || null;

          // Check if this Google account is already linked
          const existingProvider =
            await authProviderRepository.findByProviderAndProviderId(
              "google",
              providerId,
            );

          if (existingProvider) {
            // User already linked — log them in and update profile
            const user = await userRepository.findById(
              existingProvider.user_id,
            );
            if (user) {
              await userRepository.updateProfile(user.id, {
                firstname: firstName,
                lastname: lastName,
                first_name: firstName,
                last_name: lastName,
              });
            }
            return done(null, user || false);
          }

          // Check if a user with this email already exists (conflict)
          const existingUser = await userRepository.findByEmail(email);

          if (existingUser) {
            // Conflict: email exists but not linked to Google
            // Pass conflict info to the callback route via the user object
            return done(null, {
              id: existingUser.id,
              _mergeRequired: true,
              _provider: "google",
              _providerUserId: providerId,
              _providerEmail: email,
              _firstName: firstName,
              _lastName: lastName,
            } as any);
          }

          // New user — create account without password
          const newUser = await userRepository.saveOAuthUser(
            email,
            firstName,
            lastName,
          );

          // Link Google provider
          await authProviderRepository.save(
            newUser.id,
            "google",
            providerId,
            email,
          );

          return done(null, newUser);
        } catch (err) {
          return done(err as Error);
        }
      },
    ),
  );
}

// Apple OAuth Strategy
if (
  process.env.APPLE_CLIENT_ID &&
  process.env.APPLE_TEAM_ID &&
  process.env.APPLE_KEY_ID &&
  process.env.APPLE_PRIVATE_KEY
) {
  passport.use(
    new AppleStrategy(
      {
        clientID: process.env.APPLE_CLIENT_ID,
        teamID: process.env.APPLE_TEAM_ID,
        keyID: process.env.APPLE_KEY_ID,
        privateKeyString: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        callbackURL: process.env.APPLE_CALLBACK_URL || "/auth/apple/callback",
        passReqToCallback: true,
        scope: ["name", "email"],
      },
      async (
        req: any,
        _accessToken: string,
        _refreshToken: string,
        idToken: any,
        _profile: any,
        done: any,
      ) => {
        try {
          // Apple returns idToken as a JWT — decode it
          const decoded = jwt.decode(idToken) as any;
          if (!decoded) {
            return done(new Error("Failed to decode Apple ID token"));
          }

          const email = decoded.email;
          const providerId = decoded.sub;

          if (!email) {
            return done(new Error("No email provided by Apple"));
          }

          // Apple only sends name on FIRST authorization
          // It comes from the request body, not the token
          const appleUser = req.body?.user ? JSON.parse(req.body.user) : null;
          const firstName = appleUser?.name?.firstName || null;
          const lastName = appleUser?.name?.lastName || null;

          // Check if this Apple account is already linked
          const existingProvider =
            await authProviderRepository.findByProviderAndProviderId(
              "apple",
              providerId,
            );

          if (existingProvider) {
            const user = await userRepository.findById(
              existingProvider.user_id,
            );
            // Only update name if Apple provided it (first time only)
            if (user && firstName) {
              await userRepository.updateProfile(user.id, {
                firstname: firstName,
                lastname: lastName,
                first_name: firstName,
                last_name: lastName,
              });
            }
            return done(null, user || false);
          }

          // Check if a user with this email already exists (conflict)
          const existingUser = await userRepository.findByEmail(email);

          if (existingUser) {
            return done(null, {
              id: existingUser.id,
              _mergeRequired: true,
              _provider: "apple",
              _providerUserId: providerId,
              _providerEmail: email,
              _firstName: firstName,
              _lastName: lastName,
            } as any);
          }

          // New user — create account without password
          const newUser = await userRepository.saveOAuthUser(
            email,
            firstName,
            lastName,
          );

          // Link Apple provider
          await authProviderRepository.save(
            newUser.id,
            "apple",
            providerId,
            email,
          );

          return done(null, newUser);
        } catch (err) {
          return done(err as Error);
        }
      },
    ),
  );
}

export default passport;
