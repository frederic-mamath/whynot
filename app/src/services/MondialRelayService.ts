import crypto from "node:crypto";
import * as soap from "soap";

export type PackageStatus =
  | "pending"
  | "label_generated"
  | "shipped"
  | "delivered"
  | "incident";

export interface RelayPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface CreateLabelParams {
  packageId: string;
  weightGrams: number;
  /** Buyer's delivery relay point ID */
  deliveryRelayId: string;
  /** Seller's collection relay point ID (nearest relay to seller's address) */
  collectionRelayId: string;
  seller: {
    name: string;
    street: string;
    city: string;
    zipCode: string;
    country: string;
  };
  buyer: {
    firstname: string;
    lastname: string;
    city: string;
    zipCode: string;
    country: string;
  };
}

export interface CreateLabelResult {
  trackingNumber: string;
  labelUrl: string; // base64 PDF data URI — open in new tab
}

export interface TrackingResult {
  status: PackageStatus;
  lastEvent: string | null;
  lastEventAt: Date | null;
}

// ---------------------------------------------------------------------------
// Mondial Relay Web Service v4 (SOAP/XML)
// WSDL: https://api.mondialrelay.com/WebService.asmx?WSDL
// Auth: MD5(all param values in order + PrivateKey), uppercase hex
// ---------------------------------------------------------------------------

const WSDL_URL = "https://api.mondialrelay.com/WebService.asmx?WSDL";

/** MD5 of all values joined without separator, uppercase hex */
function computeHash(values: string[], privateKey: string): string {
  return crypto
    .createHash("md5")
    .update([...values, privateKey].join(""))
    .digest("hex")
    .toUpperCase();
}

export class MondialRelayService {
  private readonly customerId: string;
  private readonly privateKey: string;

  constructor() {
    const customerId = process.env.MONDIAL_RELAY_CUSTOMER_ID;
    const privateKey = process.env.MONDIAL_RELAY_API_KEY;

    if (!customerId || !privateKey) {
      throw new Error(
        "MONDIAL_RELAY_CUSTOMER_ID and MONDIAL_RELAY_API_KEY are required",
      );
    }

    this.customerId = customerId;
    this.privateKey = privateKey;
  }

  private async getClient() {
    return soap.createClientAsync(WSDL_URL, {
      endpoint: "https://api.mondialrelay.com/WebService.asmx",
    });
  }

  async searchRelayPoints(
    postcode: string,
    country: string = "FR",
  ): Promise<RelayPoint[]> {
    // Hash covers ALL fields in WSDL order (including DelaiEnvoi="0") + private key
    const security = computeHash(
      [this.customerId, country, "", "", postcode, "", "", "", "", "", "0", "", "", "", "7"],
      this.privateKey,
    );

    const client = await this.getClient();
    const [result] = await client.WSI4_PointRelais_RechercheAsync({
      Enseigne: this.customerId,
      Pays: country,
      NumPointRelais: "",
      Ville: "",
      CP: postcode,
      Latitude: "",
      Longitude: "",
      Taille: "",
      Poids: "",
      Action: "",
      DelaiEnvoi: "0",
      RayonRecherche: "",
      TypeActivite: "",
      NACE: "",
      NombreResultats: "7",
      Security: security,
    });

    const data = result?.WSI4_PointRelais_RechercheResult;
    const stat: string = data?.STAT ?? "";
    if (stat !== "0") {
      throw new Error(`Mondial Relay relay search failed (STAT=${stat})`);
    }

    const points: any[] = data?.PointsRelais?.PointRelais_Details ?? [];
    const list = Array.isArray(points) ? points : [points];

    return list.map((p: any): RelayPoint => ({
      id: p.Num ?? "",
      name: p.LgAdr1 ?? p.Localisation1 ?? "",
      address: [p.LgAdr2, p.LgAdr3].filter(Boolean).join(", "),
      city: p.Ville ?? "",
      zipCode: p.CP ?? "",
      country: p.Pays ?? "",
      latitude: parseFloat(String(p.Latitude ?? "0").replace(",", ".")),
      longitude: parseFloat(String(p.Longitude ?? "0").replace(",", ".")),
    }));
  }

  async createLabel(params: CreateLabelParams): Promise<CreateLabelResult> {
    const p = params;
    // Hash = fields 1-45 in WSDL order (excluding Texte) + private key
    // Fields: Enseigne, ModeCol, ModeLiv, NDossier, NClient,
    //   Expe_Langage, Expe_Ad1..Ad4, Expe_Ville, Expe_CP, Expe_Pays, Expe_Tel1, Expe_Tel2, Expe_Mail,
    //   Dest_Langage, Dest_Ad1..Ad4, Dest_Ville, Dest_CP, Dest_Pays, Dest_Tel1, Dest_Tel2, Dest_Mail,
    //   Poids, Longueur, Taille, NbColis, CRT_Valeur, CRT_Devise, Exp_Valeur, Exp_Devise,
    //   COL_Rel_Pays, COL_Rel, LIV_Rel_Pays, LIV_Rel,
    //   TAvisage, TReprise, Montage, TRDV, Assurance, Instructions
    const hashFields = [
      this.customerId, "REL", "24R",
      `WN-${p.packageId.substring(0, 8).toUpperCase()}`, "",
      "FR", p.seller.name, "", p.seller.street, "",
      p.seller.city, p.seller.zipCode, p.seller.country || "FR", "", "", "",
      "FR", `${p.buyer.firstname} ${p.buyer.lastname}`.trim(), "", "", "",
      p.buyer.city, p.buyer.zipCode, p.buyer.country || "FR", "", "", "",
      String(p.weightGrams), "", "", "1", "0", "", "0", "",
      "FR", p.collectionRelayId, "FR", p.deliveryRelayId,
      "", "", "", "", "", "",
    ];
    const security = computeHash(hashFields, this.privateKey);

    const client = await this.getClient();
    const [result] = await client.WSI2_CreationEtiquetteAsync({
      Enseigne: this.customerId,
      ModeCol: "REL",
      ModeLiv: "24R",
      NDossier: `WN-${p.packageId.substring(0, 8).toUpperCase()}`,
      NClient: "",
      Expe_Langage: "FR",
      Expe_Ad1: p.seller.name,
      Expe_Ad2: "",
      Expe_Ad3: p.seller.street,
      Expe_Ad4: "",
      Expe_Ville: p.seller.city,
      Expe_CP: p.seller.zipCode,
      Expe_Pays: p.seller.country || "FR",
      Expe_Tel1: "",
      Expe_Tel2: "",
      Expe_Mail: "",
      Dest_Langage: "FR",
      Dest_Ad1: `${p.buyer.firstname} ${p.buyer.lastname}`.trim(),
      Dest_Ad2: "",
      Dest_Ad3: "",
      Dest_Ad4: "",
      Dest_Ville: p.buyer.city,
      Dest_CP: p.buyer.zipCode,
      Dest_Pays: p.buyer.country || "FR",
      Dest_Tel1: "",
      Dest_Tel2: "",
      Dest_Mail: "",
      Poids: String(p.weightGrams),
      Longueur: "",
      Taille: "",
      NbColis: "1",
      CRT_Valeur: "0",
      CRT_Devise: "",
      Exp_Valeur: "0",
      Exp_Devise: "",
      COL_Rel_Pays: "FR",
      COL_Rel: p.collectionRelayId,
      LIV_Rel_Pays: "FR",
      LIV_Rel: p.deliveryRelayId,
      TAvisage: "",
      TReprise: "",
      Montage: "",
      TRDV: "",
      Assurance: "",
      Instructions: "",
      Security: security,
      Texte: "",
    });

    const data = result?.WSI2_CreationEtiquetteResult;
    const stat: string = data?.STAT ?? "";
    if (stat !== "0") {
      throw new Error(`Mondial Relay label creation failed (STAT=${stat})`);
    }

    const trackingNumber: string = data?.ExpeditionNum ?? "";
    const labelUrl: string = data?.URL_Etiquette ?? "";

    if (!trackingNumber) {
      throw new Error("Mondial Relay did not return a tracking number");
    }

    return { trackingNumber, labelUrl };
  }

  async getTracking(trackingNumber: string): Promise<TrackingResult> {
    // Hash = Enseigne + Expedition + PrivateKey
    const security = computeHash(
      [this.customerId, trackingNumber],
      this.privateKey,
    );

    const client = await this.getClient();
    const [result] = await client.WSI2_TracingColisDetailleAsync({
      Enseigne: this.customerId,
      Expedition: trackingNumber,
      Langue: "FR",
      Security: security,
    });

    const data = result?.WSI2_TracingColisDetailleResult;
    const stat: string = data?.STAT ?? "";
    if (stat !== "0") {
      throw new Error(`Mondial Relay tracking failed (STAT=${stat})`);
    }

    const events: any[] = data?.ListEvenements?.Evenement ?? [];
    const list = Array.isArray(events) ? events : [events];
    const lastEvent = list[list.length - 1];
    const code: string = lastEvent?.Code ?? "";

    let status: PackageStatus = "shipped";
    if (code === "80" || code === "81") status = "delivered";
    if (code === "97" || code === "24") status = "incident";

    return {
      status,
      lastEvent: lastEvent?.Libelle ?? null,
      lastEventAt: lastEvent?.Date ? new Date(lastEvent.Date) : null,
    };
  }
}

export const mondialRelayService = new MondialRelayService();
