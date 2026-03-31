import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const FROM = "Popup <no-reply@popup-live.fr>";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "https://popup-live.fr";

let client: SESClient | null = null;

function getClient(): SESClient {
  if (!client) {
    client = new SESClient({
      region: process.env.AWS_REGION ?? "eu-west-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

function buildHtml(role: "buyer" | "seller"): string {
  const roleMessage =
    role === "seller"
      ? "Vous serez parmi les premiers à créer votre boutique et diffuser vos lives."
      : "Vous serez parmi les premiers à accéder aux lives et aux ventes exclusives.";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenue sur Popup !</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#141414;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:#c8ff00;padding:32px 40px;text-align:center;">
              <span style="font-size:28px;font-weight:900;color:#0a0a0a;letter-spacing:-1px;font-family:'Helvetica Neue',Arial,sans-serif;">Popup</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;color:#ffffff;">
              <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:#ffffff;">
                🎉 Vous êtes sur la liste d'attente !
              </h1>
              <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#a0a0a0;">
                Merci de rejoindre l'aventure Popup. ${roleMessage}
              </p>
              <p style="margin:0 0 32px 0;font-size:16px;line-height:1.6;color:#a0a0a0;">
                On vous contactera dès que votre accès sera prêt. Restez connecté·e !
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:12px;background-color:#c8ff00;">
                    <a href="${FRONTEND_URL}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#0a0a0a;text-decoration:none;font-family:'Helvetica Neue',Arial,sans-serif;">
                      Découvrir Popup →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #2a2a2a;text-align:center;">
              <p style="margin:0;font-size:12px;color:#555555;">
                Vous recevez cet email car vous vous êtes inscrit·e sur la liste d'attente Popup.<br />
                © ${new Date().getFullYear()} Popup — popup-live.fr
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendWaitlistConfirmation(
  email: string,
  role: "buyer" | "seller",
): Promise<void> {
  await getClient().send(
    new SendEmailCommand({
      Source: FROM,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: {
          Data: "🎉 Vous êtes sur la liste d'attente Popup !",
          Charset: "UTF-8",
        },
        Body: {
          Html: { Data: buildHtml(role), Charset: "UTF-8" },
          Text: {
            Data: `Bienvenue sur la liste d'attente Popup !\n\n${
              role === "seller"
                ? "Vous serez parmi les premiers à créer votre boutique et diffuser vos lives."
                : "Vous serez parmi les premiers à accéder aux lives et aux ventes exclusives."
            }\n\nÀ très vite,\nL'équipe Popup\n${FRONTEND_URL}`,
            Charset: "UTF-8",
          },
        },
      },
    }),
  );
}
