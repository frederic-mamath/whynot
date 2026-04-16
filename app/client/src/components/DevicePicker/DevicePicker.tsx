import { useState } from "react";
import { Camera, Mic, Video } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import IconButton from "@/components/ui/IconButton/IconButton";
import { cn } from "@/lib/utils";

interface Props {
  cameras: MediaDeviceInfo[];
  microphones: MediaDeviceInfo[];
  selectedCameraId: string | null;
  selectedMicId: string | null;
  onSwitchCamera: (deviceId: string) => void;
  onSwitchMicrophone: (deviceId: string) => void;
  onOpen: () => void;
}

export default function DevicePicker({
  cameras,
  microphones,
  selectedCameraId,
  selectedMicId,
  onSwitchCamera,
  onSwitchMicrophone,
  onOpen,
}: Props) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (next) onOpen();
    setOpen(next);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <IconButton
          className="border-white text-white"
          icon={<Video size={20} />}
          size={50}
          onClick={() => {}}
        />
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader>
          <SheetTitle>Appareils</SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex flex-col gap-6">
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Camera size={16} className="text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">
                Caméra
              </span>
            </div>
            {cameras.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : (
              <div className="flex flex-col gap-1">
                {cameras.map((cam) => (
                  <button
                    key={cam.deviceId}
                    onClick={() => {
                      onSwitchCamera(cam.deviceId);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                      cam.deviceId === selectedCameraId
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {cam.label || `Caméra ${cameras.indexOf(cam) + 1}`}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-2">
              <Mic size={16} className="text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">
                Microphone
              </span>
            </div>
            {microphones.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : (
              <div className="flex flex-col gap-1">
                {microphones.map((mic) => (
                  <button
                    key={mic.deviceId}
                    onClick={() => {
                      onSwitchMicrophone(mic.deviceId);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                      mic.deviceId === selectedMicId
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {mic.label || `Microphone ${microphones.indexOf(mic) + 1}`}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
