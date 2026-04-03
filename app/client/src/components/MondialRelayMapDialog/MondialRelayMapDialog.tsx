import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Input from "@/components/ui/Input/Input";
import ButtonV2 from "@/components/ui/ButtonV2";

// Fix default marker icons broken by webpack/vite bundling
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type RelayPoint = {
  id: string;
  name: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  latitude: number;
  longitude: number;
};

interface FlyToProps {
  points: RelayPoint[];
}

function FlyToResults({ points }: FlyToProps) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      map.flyTo([points[0].latitude, points[0].longitude], 13);
    }
  }, [points, map]);
  return null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (point: RelayPoint) => void;
}

export default function MondialRelayMapDialog({ open, onOpenChange, onSave }: Props) {
  const [postcode, setPostcode] = useState("");
  const [searchEnabled, setSearchEnabled] = useState(false);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setPostcode("");
      setSearchEnabled(false);
    }
  }, [open]);

  const { data: points, isLoading } = trpc.profile.addresses.searchRelayPoints.useQuery(
    { postcode, country: "FR" },
    { enabled: searchEnabled && postcode.length >= 4 },
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>Choisir un Point Relais</DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-3 flex gap-2">
          <Input
            type="text"
            placeholder="Code postal (ex: 75001)"
            value={postcode}
            onChange={(v) => {
              setPostcode(v);
              setSearchEnabled(false);
            }}
            className="flex-1"
          />
          <ButtonV2
            label="Rechercher"
            onClick={() => setSearchEnabled(true)}
            disabled={postcode.length < 4 || isLoading}
            className="bg-primary text-primary-foreground shrink-0"
          />
        </div>

        {isLoading && (
          <p className="px-4 pb-2 text-sm text-muted-foreground">Recherche en cours…</p>
        )}
        {searchEnabled && points?.length === 0 && !isLoading && (
          <p className="px-4 pb-2 text-sm text-muted-foreground">
            Aucun point relais trouvé pour ce code postal.
          </p>
        )}

        <div className="h-[380px] w-full">
          <MapContainer
            center={[46.2, 2.2]}
            zoom={6}
            className="h-full w-full"
            scrollWheelZoom
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {points && points.length > 0 && (
              <>
                <FlyToResults points={points} />
                {points.map((point) => (
                  <Marker key={point.id} position={[point.latitude, point.longitude]}>
                    <Popup>
                      <div className="space-y-1 min-w-[160px]">
                        <p className="font-semibold text-sm">{point.name}</p>
                        <p className="text-xs text-gray-500">
                          {point.address}, {point.zipCode} {point.city}
                        </p>
                        <ButtonV2
                          label="Choisir ce point"
                          onClick={() => {
                            onSave(point);
                            onOpenChange(false);
                          }}
                          className="bg-primary text-primary-foreground w-full mt-2"
                        />
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </>
            )}
          </MapContainer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
