import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Radio, Play, Calendar, Clock, ChevronRight } from "lucide-react";
import { trpc } from "../lib/trpc";
import Tabs from "@/components/ui/Tabs";
import ButtonV2 from "@/components/ui/ButtonV2";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SellerLivePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("programme");

  // Schedule form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayDate());
  const [time, setTime] = useState("20:00");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  const { data, isLoading, refetch } = trpc.live.listByHost.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const scheduleMutation = trpc.live.schedule.useMutation({
    onSuccess: () => {
      setFormSuccess(true);
      setName("");
      setDescription("");
      setDate(todayDate());
      setTime("20:00");
      setFormError("");
      refetch();
      setTimeout(() => {
        setActiveTab("programme");
        setFormSuccess(false);
      }, 1200);
    },
    onError: (err) => setFormError(err.message),
  });

  const startMutation = trpc.live.start.useMutation({
    onSuccess: (data) => {
      navigate(`/live/${data.live?.id}`);
    },
    onError: (err) => alert(err.message),
  });

  function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!name.trim() || name.length < 3) {
      setFormError("Le nom doit contenir au moins 3 caractères.");
      return;
    }
    const startsAt = new Date(`${date}T${time}:00`).toISOString();
    scheduleMutation.mutate({ name: name.trim(), description: description.trim() || undefined, startsAt });
  }

  const tabs = [
    { id: "programme", label: "Programme" },
    { id: "new", label: "+ Live" },
  ];

  return (
    <div className="flex flex-col min-h-screen pb-4">
      <div className="px-4 pt-6 pb-2">
        <h1 className="font-syne font-extrabold text-xl text-foreground mb-4">Lives</h1>
        <Tabs selectedTabId={activeTab} items={tabs} onClickItem={setActiveTab} />
      </div>

      {activeTab === "programme" && (
        <div className="flex flex-col gap-6 px-4 pt-4">
          {/* À venir */}
          <section>
            <h2 className="font-syne font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">
              À venir
            </h2>
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Chargement…</p>
            ) : (data?.upcoming ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                <Calendar className="w-8 h-8" />
                <p className="text-sm">Aucun live programmé</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {(data?.upcoming ?? []).map((live) => (
                  <Card key={live.id}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="font-syne font-bold text-sm text-foreground truncate">
                            {live.name}
                          </span>
                          <span className="text-xs text-muted-foreground font-outfit flex items-center gap-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            {formatDateTime(live.starts_at)}
                          </span>
                          {live.description && (
                            <span className="text-xs text-muted-foreground font-outfit mt-1 line-clamp-2">
                              {live.description}
                            </span>
                          )}
                        </div>
                        <ButtonV2
                          icon={<Play className="w-3 h-3" />}
                          label="Démarrer"
                          className="bg-primary text-primary-foreground shrink-0 text-xs px-3"
                          disabled={startMutation.isPending}
                          onClick={() => startMutation.mutate({ liveId: live.id })}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Passés */}
          <section>
            <h2 className="font-syne font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">
              Passés
            </h2>
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Chargement…</p>
            ) : (data?.past ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                <Radio className="w-8 h-8" />
                <p className="text-sm">Aucun live passé</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {(data?.past ?? []).map((live) => (
                  <Card key={live.id} className="opacity-80">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="font-syne font-bold text-sm text-foreground truncate">
                            {live.name}
                          </span>
                          <span className="text-xs text-muted-foreground font-outfit flex items-center gap-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            {formatDateTime(live.starts_at)}
                          </span>
                        </div>
                        <span className="text-xs font-outfit text-muted-foreground shrink-0 flex items-center gap-1">
                          {live.status === "active" ? (
                            <span className="text-primary font-bold">En cours</span>
                          ) : (
                            "Terminé"
                          )}
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === "new" && (
        <form onSubmit={handleSchedule} className="flex flex-col gap-4 px-4 pt-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="live-name">Nom du live *</Label>
            <Input
              id="live-name"
              type="text"
              placeholder="Mon live du soir"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="live-desc">Description</Label>
            <Textarea
              id="live-desc"
              placeholder="Au programme ce soir…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="live-date">Date</Label>
              <Input
                id="live-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor="live-time">Heure</Label>
              <Input
                id="live-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          {formError && (
            <p className="text-destructive text-sm font-outfit">{formError}</p>
          )}

          {formSuccess && (
            <p className="text-primary text-sm font-outfit font-bold">
              Live programmé !
            </p>
          )}

          <ButtonV2
            type="submit"
            label={scheduleMutation.isPending ? "Programmation…" : "Programmer ce live"}
            className="bg-primary text-primary-foreground mt-2"
            disabled={scheduleMutation.isPending}
          />
        </form>
      )}
    </div>
  );
}
