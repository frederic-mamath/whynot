import { Router } from "express";
import passport from "../config/passport";
import { generateMergeToken } from "../utils/auth";

const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Google OAuth - initiate
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

// Google OAuth - callback
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${FRONTEND_URL}/login?error=google_auth_failed`,
    session: true,
  }),
  (req, res) => {
    const user = req.user as any;

    if (!user) {
      return res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
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
        `${FRONTEND_URL}/account-merge?provider=${user._provider}&token=${encodeURIComponent(mergeToken)}`,
      );
    }

    // Successful login — create session
    req.logIn(user, (err) => {
      if (err) {
        return res.redirect(`${FRONTEND_URL}/login?error=session_failed`);
      }
      return res.redirect(`${FRONTEND_URL}/dashboard`);
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
    failureRedirect: `${FRONTEND_URL}/login?error=apple_auth_failed`,
    session: true,
  }),
  (req, res) => {
    const user = req.user as any;

    if (!user) {
      return res.redirect(`${FRONTEND_URL}/login?error=apple_auth_failed`);
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
        `${FRONTEND_URL}/account-merge?provider=${user._provider}&token=${encodeURIComponent(mergeToken)}`,
      );
    }

    // Successful login — create session
    req.logIn(user, (err) => {
      if (err) {
        return res.redirect(`${FRONTEND_URL}/login?error=session_failed`);
      }
      return res.redirect(`${FRONTEND_URL}/dashboard`);
    });
  },
);

export default router;
