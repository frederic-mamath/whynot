import { Router } from "express";
import passport from "../config/passport";
import { generateMergeToken } from "../utils/auth";

const router = Router();

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Google OAuth - initiate
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

// Google OAuth - callback
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login?error=google_auth_failed",
    session: false,
  }),
  (req, res) => {
    const user = req.user as any;

    if (!user) {
      return res.redirect("/login?error=google_auth_failed");
    }

    // Check if merge is required
    if (user._mergeRequired) {
      const mergeToken = generateMergeToken({
        userId: user.id,
        provider: user._provider,
        providerUserId: user._providerUserId,
        providerEmail: user._providerEmail,
        firstName: user._firstName,
        lastName: user._lastName,
      });

      return res.redirect(
        `/account-merge?provider=${user._provider}&token=${encodeURIComponent(mergeToken)}`,
      );
    }

    // Successful login — create session
    req.logIn(user, (err) => {
      if (err) {
        return res.redirect("/login?error=session_failed");
      }
      return res.redirect("/dashboard");
    });
  },
);

// Apple OAuth - initiate
router.get(
  "/auth/apple",
  passport.authenticate("apple", { scope: ["name", "email"] }),
);

// Apple OAuth - callback (Apple uses POST)
router.post(
  "/auth/apple/callback",
  passport.authenticate("apple", {
    failureRedirect: "/login?error=apple_auth_failed",
    session: false,
  }),
  (req, res) => {
    const user = req.user as any;

    if (!user) {
      return res.redirect("/login?error=apple_auth_failed");
    }

    // Check if merge is required
    if (user._mergeRequired) {
      const mergeToken = generateMergeToken({
        userId: user.id,
        provider: user._provider,
        providerUserId: user._providerUserId,
        providerEmail: user._providerEmail,
        firstName: user._firstName,
        lastName: user._lastName,
      });

      return res.redirect(
        `/account-merge?provider=${user._provider}&token=${encodeURIComponent(mergeToken)}`,
      );
    }

    // Successful login — create session
    req.logIn(user, (err) => {
      if (err) {
        return res.redirect("/login?error=session_failed");
      }
      return res.redirect("/dashboard");
    });
  },
);

export default router;
