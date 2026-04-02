import Mailjet from "node-mailjet";

const FROM_EMAIL = process.env.MAILJET_FROM_EMAIL || "noreply@popup.app";
const FROM_NAME = process.env.MAILJET_FROM_NAME || "Popup";

export class EmailService {
  async sendPasswordResetEmail(
    toEmail: string,
    resetToken: string,
  ): Promise<void> {
    // Instanciate lazily so env vars are always read at call time (not module load time)
    const apiKey = process.env.MAILJET_API_KEY;
    const apiSecret = process.env.MAILJET_SECRET_KEY;

    console.log("[EmailService] sendPasswordResetEmail called", {
      toEmail,
      FROM_EMAIL,
      FROM_NAME,
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
    });

    if (!apiKey || !apiSecret) {
      console.error(
        "[EmailService] Missing Mailjet credentials — email NOT sent",
      );
      return;
    }

    const mailjet = new Mailjet({ apiKey, apiSecret });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    try {
      const result = await mailjet.post("send", { version: "v3.1" }).request({
        Messages: [
          {
            From: { Email: FROM_EMAIL, Name: FROM_NAME },
            To: [{ Email: toEmail }],
            Subject: "Réinitialise ton mot de passe",
            HTMLPart: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
              <h2 style="color: #f0f0e8;">Réinitialisation de mot de passe</h2>
              <p style="color: #777; font-size: 14px; line-height: 1.6;">
                Tu as demandé à réinitialiser ton mot de passe. Clique sur le lien ci-dessous pour en choisir un nouveau.
                Ce lien expire dans 1 heure.
              </p>
              <a href="${resetLink}" style="display: inline-block; background: rgb(224, 255, 0); color: #000; padding: 14px 32px; border-radius: 28px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 24px 0;">
                Réinitialiser mon mot de passe
              </a>
              <p style="color: #777; font-size: 12px; line-height: 1.6;">
                Si tu n'as pas fait cette demande, ignore cet email.
              </p>
            </div>
          `,
          },
        ],
      });

      console.log("[EmailService] Mailjet response", {
        status: result.response.status,
        body: JSON.stringify(result.body),
      });
    } catch (err: any) {
      console.error("[EmailService] Mailjet error", {
        message: err?.message,
        statusCode: err?.statusCode,
        response: err?.response?.data ?? err?.response?.body,
      });
      throw err;
    }
  }
  async sendLiveScheduledEmail(
    toEmail: string,
    payload: {
      sellerNickname: string;
      liveName: string;
      liveDescription: string;
      startsAt: Date;
      liveId: number;
    },
  ): Promise<void> {
    const apiKey = process.env.MAILJET_API_KEY;
    const apiSecret = process.env.MAILJET_SECRET_KEY;

    if (!apiKey || !apiSecret) {
      console.error(
        "[EmailService] Missing Mailjet credentials — live scheduled email NOT sent",
      );
      return;
    }

    const mailjet = new Mailjet({ apiKey, apiSecret });
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const joinLink = `${frontendUrl}/live/${payload.liveId}`;

    const formattedDate = payload.startsAt.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    try {
      await mailjet.post("send", { version: "v3.1" }).request({
        Messages: [
          {
            From: { Email: FROM_EMAIL, Name: FROM_NAME },
            To: [{ Email: toEmail }],
            Subject: `🎥 ${payload.sellerNickname} est sur le point de lancer un live !`,
            HTMLPart: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0d0d0d; color: #f0f0e8;">
              <h2 style="color: #f0f0e8; margin-bottom: 8px;">${payload.sellerNickname} lance un live !</h2>
              <h3 style="color: #e0ff00; margin-top: 0; margin-bottom: 16px;">${payload.liveName}</h3>
              ${
                payload.liveDescription
                  ? `<p style="color: #999; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">${payload.liveDescription}</p>`
                  : ""
              }
              <p style="color: #777; font-size: 14px; margin-bottom: 24px;">
                📅 <strong style="color: #f0f0e8;">${formattedDate}</strong>
              </p>
              <a href="${joinLink}" style="display: inline-block; background: rgb(224, 255, 0); color: #000; padding: 14px 32px; border-radius: 28px; text-decoration: none; font-weight: 600; font-size: 14px;">
                Rejoindre le live
              </a>
            </div>
          `,
          },
        ],
      });
    } catch (err: any) {
      console.error("[EmailService] sendLiveScheduledEmail error", {
        message: err?.message,
        statusCode: err?.statusCode,
      });
    }
  }
}

export const emailService = new EmailService();
