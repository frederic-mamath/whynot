import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function CguPage() {
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
        Conditions Générales d&apos;Utilisation
      </h1>
      <p className="font-outfit text-muted-foreground text-[12px] mb-8">
        Dernière mise à jour : mars 2026
      </p>

      <div className="font-outfit text-foreground text-[14px] leading-[22px] flex flex-col gap-6">
        <section>
          <h2 className="font-syne font-bold text-[16px] mb-2">
            1. Objet du service
          </h2>
          <p>
            Popup est une plateforme de live shopping permettant à des vendeurs
            (ci-après « Vendeurs ») de diffuser en direct des sessions de vente
            vidéo et à des acheteurs (ci-après « Acheteurs ») d&apos;y
            participer, de consulter des produits et d&apos;effectuer des achats
            en temps réel, y compris via des systèmes d&apos;enchères.
          </p>
          <p className="mt-2">
            Les présentes Conditions Générales d&apos;Utilisation (ci-après «
            CGU ») régissent l&apos;accès et l&apos;utilisation de
            l&apos;application Popup, accessible sur mobile et navigateur web.
          </p>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[16px] mb-2">
            2. Inscription et gestion du compte
          </h2>
          <p>
            L&apos;accès aux fonctionnalités de Popup nécessite la création
            d&apos;un compte utilisateur. Vous pouvez vous inscrire avec une
            adresse email et un mot de passe, ou via votre compte Google ou
            Apple.
          </p>
          <p className="mt-2">
            Vous vous engagez à fournir des informations exactes et à maintenir
            la confidentialité de vos identifiants. Vous êtes seul responsable
            des actions effectuées depuis votre compte. Toute utilisation
            frauduleuse doit être signalée immédiatement à Popup.
          </p>
          <p className="mt-2">
            Vous devez avoir au moins 18 ans pour utiliser Popup en tant que
            Vendeur. Les Acheteurs doivent avoir au moins 16 ans ou disposer du
            consentement d&apos;un représentant légal.
          </p>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[16px] mb-2">
            3. Conditions d&apos;utilisation — Vendeurs
          </h2>
          <p>
            Les Vendeurs s&apos;engagent à ne diffuser que des produits licites,
            conformes à la législation française et européenne applicable. Sont
            notamment interdits : les produits contrefaits, les substances
            contrôlées, les articles portant atteinte à des droits de propriété
            intellectuelle, ainsi que tout contenu illégal.
          </p>
          <p className="mt-2">
            Les Vendeurs sont tenus de décrire les produits avec exactitude et
            de respecter les délais d&apos;expédition annoncés. Popup se réserve
            le droit de suspendre ou de désactiver un compte Vendeur en cas de
            manquement à ces obligations.
          </p>
          <p className="mt-2">
            Les Vendeurs doivent être en mesure de traiter leurs paiements via
            Stripe et d&apos;accepter les conditions d&apos;utilisation de
            Stripe Connect.
          </p>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[16px] mb-2">
            4. Conditions d&apos;utilisation — Acheteurs
          </h2>
          <p>
            Les Acheteurs s&apos;engagent à régler intégralement tout achat ou
            enchère remportée. En cas de participation à une enchère, toute
            offre est ferme et définitive. L&apos;Acheteur remportant la mise
            finale est tenu de finaliser son achat dans les délais impartis.
          </p>
          <p className="mt-2">
            Les Acheteurs peuvent retourner un article conformément aux droits
            légaux applicables en France (droit de rétractation de 14 jours pour
            les achats à distance), sauf pour les biens susceptibles de se
            détériorer rapidement ou les articles personnalisés.
          </p>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[16px] mb-2">
            5. Enchères et paiements
          </h2>
          <p>
            Les sessions d&apos;enchères sur Popup permettent aux Vendeurs de
            proposer des articles à prix de départ, les Acheteurs enchérissant
            en temps réel. Le système d&apos;enchères est géré en temps réel ;
            toute offre validée est contractuellement engageante.
          </p>
          <p className="mt-2">
            Les paiements sont traités exclusivement via Stripe. Popup ne stocke
            aucune donnée de carte bancaire. Les fonds sont versés aux Vendeurs
            après déduction des frais de service de Popup, conformément aux
            conditions tarifaires affichées sur la plateforme.
          </p>
          <p className="mt-2">
            Popup n&apos;est pas responsable des défaillances techniques
            imputables à Stripe ou à tout autre prestataire de paiement tiers.
          </p>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[16px] mb-2">
            6. Propriété intellectuelle et contenu diffusé
          </h2>
          <p>
            Les flux vidéo diffusés par les Vendeurs restent leur propriété. En
            diffusant sur Popup, vous accordez à Popup une licence mondiale, non
            exclusive et gratuite d&apos;utilisation à des fins de promotion de
            la plateforme (extraits, replays, mise en avant).
          </p>
          <p className="mt-2">
            Il est strictement interdit de diffuser du contenu illicite,
            offensant, discriminatoire, portant atteinte à des droits tiers, ou
            violant les lois en vigueur. Popup se réserve le droit de supprimer
            tout contenu contrevenant à ces règles sans préavis.
          </p>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[16px] mb-2">
            7. Responsabilité et limitation
          </h2>
          <p>
            Popup agit en tant que plateforme d&apos;intermédiation et ne peut
            être tenu responsable de la qualité, de la conformité ou de
            l&apos;authenticité des produits vendus par les Vendeurs. Les
            transactions sont conclues directement entre Vendeurs et Acheteurs.
          </p>
          <p className="mt-2">
            Dans les limites autorisées par la loi, la responsabilité de Popup
            est plafonnée au montant des commissions perçues au cours des 12
            derniers mois précédant le sinistre.
          </p>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[16px] mb-2">
            8. Résiliation
          </h2>
          <p>
            Vous pouvez supprimer votre compte à tout moment depuis les
            paramètres de votre profil. Popup se réserve le droit de suspendre
            ou de résilier votre accès en cas de violation des présentes CGU,
            sans préavis ni indemnité.
          </p>
          <p className="mt-2">
            La résiliation d&apos;un compte Vendeur en cours de session live
            entraîne l&apos;interruption immédiate du flux et l&apos;annulation
            des transactions non finalisées.
          </p>
        </section>

        <section>
          <h2 className="font-syne font-bold text-[16px] mb-2">
            9. Droit applicable
          </h2>
          <p>
            Les présentes CGU sont soumises au droit français. En cas de litige,
            les parties s&apos;engagent à rechercher une solution amiable avant
            tout recours judiciaire. À défaut d&apos;accord, les tribunaux
            compétents français seront seuls compétents.
          </p>
          <p className="mt-2">
            Pour toute question relative aux CGU, contactez-nous à :{" "}
            <span className="text-primary">contact@popup.live</span>
          </p>
        </section>
      </div>
    </div>
  );
}
