# Ticket 001 — Send Confirmation Email via AWS SES on Waitlist Signup

## Acceptance Criteria

- As a guest, on the LandingPage, when I submit the buyer waitlist form with a valid email, I should receive a confirmation email from `no-reply@popup-live.fr` with a buyer-specific message ("Vous serez parmi les premiers à accéder aux lives et aux ventes exclusives.")
- As a guest, on the LandingPage, when I submit the seller waitlist form with a valid email, I should receive a confirmation email from `no-reply@popup-live.fr` with a seller-specific message ("Vous serez parmi les premiers à créer votre boutique et diffuser vos lives.")
- As a guest, when I submit with an email already registered, I should see the existing error ("Vous êtes déjà inscrit") and no second email should be sent
- As a developer, if the AWS SES call fails, the waitlist signup should still succeed and the error should be logged to the console (fire-and-forget)

## Technical Strategy

- Backend
  - Service
    - `app/src/services/AwsSesService.ts` *(new file)*
      - `getClient()`: Lazy-init `SESClient` singleton using `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` env vars
      - `sendWaitlistConfirmation(email, role)`: Sends a branded HTML + plain-text email via `SendEmailCommand`; from address `Popup <no-reply@popup-live.fr>`; subject "🎉 Vous êtes sur la liste d'attente Popup !"; HTML template with dark theme, lime CTA button, buyer/seller copy variants
  - Router
    - `app/src/routers/waitlist.ts` *(modified)*
      - `join` mutation: after `waitlistRepository.save(...)`, call `sendWaitlistConfirmation(input.email, input.role).catch(...)` fire-and-forget so email failure never blocks the response
  - Configuration
    - `app/.env.example` *(modified)*
      - Added `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `FRONTEND_URL`

## Manual Operations to Configure Services

### AWS SES

**Reference:** https://docs.aws.amazon.com/ses/latest/dg/setting-up.html

#### 1. Create an IAM User

**1.1 — Create the user**

1. Go to [https://console.aws.amazon.com/iam](https://console.aws.amazon.com/iam)
2. In the left sidebar, click **Users** → **Create user**
3. Username: `popup-ses-sender`
4. Leave *"Provide user access to the AWS Management Console"* **unchecked** (this is a service account, not a human login)
5. Click **Next**

**1.2 — Attach an inline policy**

1. On the *Set permissions* screen, choose **Attach policies directly**
2. Skip the pre-built policy list — scroll down and click **Create inline policy** (bottom-right)
3. Switch to the **JSON** tab and paste:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Action": ["ses:SendEmail", "ses:SendRawEmail"],
       "Resource": "*"
     }]
   }
   ```
4. Click **Next** → give the policy a name: `popup-ses-send-email`
5. Click **Create policy**
6. Back on the *Set permissions* screen, the inline policy should now appear — click **Next**
7. Review and click **Create user**

**1.3 — Generate the access key**

1. On the **Users** list, click the `popup-ses-sender` user you just created
2. Go to the **Security credentials** tab
3. Scroll to the **Access keys** section → click **Create access key**
4. On the *Use case* screen, select **Application running outside AWS**
5. Optionally add a description tag (e.g. `popup-app-production`)
6. Click **Create access key**
7. **Copy both values immediately** — AWS will only show the secret once:
   - `Access key ID` → paste as `AWS_ACCESS_KEY_ID` in `.env`
   - `Secret access key` → paste as `AWS_SECRET_ACCESS_KEY` in `.env`
8. Click **Done**

> ⚠️ If you close the page without copying the secret, you must delete the key and create a new one — there is no way to retrieve it later.

#### 2. Verify the Domain `popup-live.fr`

1. **AWS SES Console** → **Verified Identities** → **Create Identity**
2. Select **Domain**, enter `popup-live.fr`
3. Enable **Easy DKIM** (RSA 2048-bit)
4. Add the generated DNS records at your domain registrar:
   - 3 × CNAME records (DKIM signing)
   - 1 × TXT record (domain ownership)
5. Wait ~5–30 min → identity status turns **Verified** ✓

Once the domain is verified, `no-reply@popup-live.fr` is automatically trusted as a sender.

#### 3. Exit the SES Sandbox (required to send to non-verified addresses)

By default SES only sends to verified addresses (sandbox mode).

1. **SES Console** → **Account dashboard** → **Request production access**
2. Fill in:
   - Mail type: **Transactional**
   - Website URL: `https://popup-live.fr`
   - Use case: "One confirmation email per waiting list signup. Users explicitly enter their email on our public landing page."
   - Opt-in process: voluntary form submission
3. AWS typically approves within a few hours to 1 business day

#### 4. Choose AWS Region

Set `AWS_REGION` to one of:
- `eu-west-1` (EU Ireland) — recommended default
- `eu-west-3` (EU Paris) — lower latency for French users

#### 5. Add DMARC Record (recommended for deliverability)

Add a DNS TXT record on `_dmarc.popup-live.fr`:
```
"v=DMARC1; p=none; rua=mailto:dmarc@popup-live.fr"
```
