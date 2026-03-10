import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen px-6 py-10 flex flex-col">
      <Link
        to="/register"
        className="text-muted flex gap-2 items-center mb-6 font-semibold"
      >
        <ArrowLeft size={16} />
        <div className="text-[12px]">Retour</div>
      </Link>

      <h1 className="font-syne text-foreground text-[22px] font-extrabold leading-[26px] mb-2">
        Politique de Confidentialité
      </h1>
      <p className="font-outfit text-muted-foreground text-[12px] mb-8">
        Dernière mise à jour : mars 2026
      </p>

      <div className="font-outfit text-foreground text-[14px] leading-[22px] flex flex-col gap-6">
        <section>
          <h2 className="font-syne font-bold text-[16px] mb-2">
            1. Introduction
          </h2>
          <p>
            Popup (ci-après « nous ») s&apos;engage à protéger vos données
            personnelles conformément au Règlement Général sur la Protection des
            Données (RGPD — Règlement UE 2016/679) et à la loi Informatique et
            Libertés.
          </p>
          <p className="mt-2">
            La présente politique décrit quelles données nous collectons,
            pourquoi nous les traitons, avec qui nous les partageons et quels
            sont vos droits.
          </p>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[16px] mb-2">
            2. Données collectées
          </h2>
          <p>Nous collectons les catégories de données suivantes :</p>
          <ul className="list-disc pl-5 mt-2 flex flex-col gap-1">
            <li>
              <strong>Compte</strong> : adresse email, pseudo, prénom, nom, mot
              de passe (haché), date d&apos;acceptation des CGU.
            </li>
            <li>
              <strong>Authentification tierce</strong> : identifiant fourni par
              Google ou Apple lors de la connexion OAuth (nous ne stockons pas
              votre mot de passe Google/Apple).
            </li>
            <li>
              <strong>Paiements</strong> : identifiant Stripe client et compte
              Stripe Connect (pour les Vendeurs). Nous ne stockons jamais vos
              numéros de carte bancaire.
            </li>
            <li>
              <strong>Live streaming</strong> : flux vidéo et audio transitant
              via les serveurs Agora RTC. Ces flux ne sont pas enregistrés par
              Popup sauf si vous activez explicitement l&apos;option
              d&apos;enregistrement (non disponible par défaut).
            </li>
            <li>
              <strong>Contenu</strong> : photos de produits, descriptions,
              messages de chat en session live.
            </li>
            <li>
              <strong>Données techniques</strong> : adresse IP (dans les logs
              serveurs), type de navigateur/appareil, logs d&apos;accès.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[16px] mb-2">
            3. Finalités du traitement
          </h2>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <strong>Exécution du contrat</strong> : création et gestion de
              votre compte, traitement des transactions, accès aux sessions
              live.
            </li>
            <li>
              <strong>Obligation légale</strong> : conservation des données de
              facturation requises par la réglementation fiscale française.
            </li>
            <li>
              <strong>Intérêt légitime</strong> : sécurité de la plateforme,
              prévention de la fraude, amélioration de nos services.
            </li>
            <li>
              <strong>Consentement</strong> : envoi d&apos;emails de marketing
              (uniquement si vous y avez consenti).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[16px] mb-2">
            4. Partage avec des tiers
          </h2>
          <p>
            Nous ne vendons pas vos données personnelles. Nous les partageons
            uniquement avec les prestataires suivants, dans la stricte mesure
            nécessaire à l&apos;exécution du service :
          </p>
          <ul className="list-disc pl-5 mt-2 flex flex-col gap-1">
            <li>
              <strong>Stripe</strong> (paiements en ligne) — votre email et vos
              informations de paiement sont transmis à Stripe pour le traitement
              des transactions. Stripe est certifié PCI-DSS.
              <br />
              <a
                href="https://stripe.com/fr/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Politique de confidentialité Stripe
              </a>
            </li>
            <li>
              <strong>Agora RTC</strong> (streaming vidéo/audio) — vos flux
              vidéo et audio passent par les infrastructures d&apos;Agora.
              Aucune donnée d&apos;identification directe n&apos;est transmise à
              Agora.
              <br />
              <a
                href="https://www.agora.io/en/privacy-policy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Politique de confidentialité Agora
              </a>
            </li>
            <li>
              <strong>Google</strong> (authentification OAuth) — si vous vous
              connectez via Google, votre identifiant Google et votre adresse
              email sont transmis.
              <br />
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Politique de confidentialité Google
              </a>
            </li>
            <li>
              <strong>Apple</strong> (authentification OAuth) — si vous vous
              connectez via Apple, votre identifiant Apple et votre adresse
              email (ou email masqué Apple) sont transmis.
              <br />
              <a
                href="https://www.apple.com/fr/legal/privacy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Politique de confidentialité Apple
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[16px] mb-2">
            5. Durée de conservation
          </h2>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <strong>Données de compte</strong> : conservées pendant la durée
              de vie de votre compte, puis 3 ans après sa suppression à des fins
              de preuve en cas de litige.
            </li>
            <li>
              <strong>Données de facturation</strong> : 10 ans conformément aux
              obligations comptables françaises.
            </li>
            <li>
              <strong>Logs techniques</strong> : 12 mois.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[16px] mb-2">
            6. Vos droits (RGPD)
          </h2>
          <p>
            Conformément au RGPD, vous disposez des droits suivants concernant
            vos données personnelles :
          </p>
          <ul className="list-disc pl-5 mt-2 flex flex-col gap-1">
            <li>
              <strong>Droit d&apos;accès</strong> : obtenir une copie de vos
              données.
            </li>
            <li>
              <strong>Droit de rectification</strong> : corriger des données
              inexactes.
            </li>
            <li>
              <strong>Droit à l&apos;effacement</strong> : demander la
              suppression de votre compte et de vos données.
            </li>
            <li>
              <strong>Droit à la portabilité</strong> : recevoir vos données
              dans un format structuré.
            </li>
            <li>
              <strong>Droit d&apos;opposition</strong> : vous opposer au
              traitement fondé sur notre intérêt légitime.
            </li>
            <li>
              <strong>Droit de retrait du consentement</strong> : retirer votre
              consentement à tout moment sans affecter les traitements
              antérieurs.
            </li>
          </ul>
          <p className="mt-2">
            Pour exercer ces droits, contactez-nous à :{" "}
            <span className="text-primary">privacy@popup.live</span>
          </p>
          <p className="mt-2 text-muted-foreground text-[12px]">
            Vous disposez également du droit d&apos;introduire une réclamation
            auprès de la CNIL (Commission Nationale de l&apos;Informatique et
            des Libertés) :{" "}
            <a
              href="https://www.cnil.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              www.cnil.fr
            </a>
          </p>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[16px] mb-2">7. Sécurité</h2>
          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles
            appropriées pour protéger vos données contre tout accès non
            autorisé, perte ou divulgation. Les mots de passe sont chiffrés avec
            bcrypt. Les communications sont sécurisées par HTTPS/TLS.
          </p>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[16px] mb-2">8. Contact</h2>
          <p>
            Pour toute question relative à cette politique ou pour exercer vos
            droits, contactez notre délégué à la protection des données :
          </p>
          <p className="mt-2">
            <strong>Email</strong> :{" "}
            <span className="text-primary">privacy@popup.live</span>
          </p>
        </section>
      </div>
    </div>
  );
}
