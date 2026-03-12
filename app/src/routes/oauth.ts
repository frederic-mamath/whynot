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
router.get("/auth/google/callback", (req, res, next) => {
  passport.authenticate("google", (err: any, user: any) => {
    if (err || !user) {
      return res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
    }

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

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return res.redirect(`${FRONTEND_URL}/login?error=session_failed`);
      }
      return res.redirect(`${FRONTEND_URL}/home`);
    });
  })(req, res, next);
});

// Apple OAuth - initiate
router.get(
  "/auth/apple",
  passport.authenticate("apple", { scope: ["name", "email"] }),
);

// Apple OAuth - callback (Apple uses POST)
router.post("/auth/apple/callback", (req, res, next) => {
  passport.authenticate("apple", (err: any, user: any) => {
    if (err) {
      console.error(
        "[Apple OAuth] Authentication error:",
        err.message,
        err.stack,
      );
      return res.redirect(`${FRONTEND_URL}/login?error=apple_auth_failed`);
    }
    if (!user) {
      console.error(
        "[Apple OAuth] No user returned from Apple strategy. req.body keys:",
        Object.keys(req.body || {}),
      );
      return res.redirect(`${FRONTEND_URL}/login?error=apple_auth_failed`);
    }

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

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return res.redirect(`${FRONTEND_URL}/login?error=session_failed`);
      }
      return res.redirect(`${FRONTEND_URL}/home`);
    });
  })(req, res, next);
});

export default router;
