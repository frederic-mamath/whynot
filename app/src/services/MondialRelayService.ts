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
  relayPointId: string;
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
  };
  relay: {
    streetName: string;
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
    // TODO: implement via WSI2_CreationEtiquette when ready to test
    throw new Error(
      "Label creation via Mondial Relay SOAP is not yet implemented",
    );
  }

  async getTracking(trackingNumber: string): Promise<TrackingResult> {
    // TODO: implement via WSI2_TracingColisDetaille when ready to test
    throw new Error(
      "Tracking via Mondial Relay SOAP is not yet implemented",
    );
  }
}

export const mondialRelayService = new MondialRelayService();
