import { useState, FormEvent, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Video, Lock, Users, ArrowLeft, Store } from "lucide-react";
import { trpc } from "../lib/trpc";
import { isAuthenticated } from "../lib/auth";
import Button from "../components/ui/button";
import Input from "../components/ui/Input/Input";
import Label from "../components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card";

export default function ChannelCreatePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState("");

  const { data: userShops, isLoading: isLoadingShops } =
    trpc.shop.list.useQuery();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (!isLoadingShops && userShops && userShops.length === 0) {
      setError(t("channels.create.noShopError"));
    }
  }, [userShops, isLoadingShops]);

  const createMutation = trpc.live.create.useMutation({
    onSuccess: (data) => {
      navigate(`/live/${data.channel.id}`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!userShops || userShops.length === 0) {
      setError(t("channels.create.noShopError"));
      return;
    }

    if (name.length < 3) {
      setError(t("channels.create.channelNameError"));
      return;
    }

    createMutation.mutate({
      name,
      maxParticipants,
      isPrivate,
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" asChild>
          <Link to="/lives">
            <ArrowLeft className="size-4 mr-2" />
            {t("channels.create.backToChannels")}
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="size-6" />
              {t("channels.create.title")}
            </CardTitle>
            <CardDescription>
              {t("channels.create.description")}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive text-destructive text-sm">
                <p>{error}</p>
                {error.includes("shop") && (
                  <p className="mt-2">
                    <Link to="/shops" className="underline font-medium">
                      {t("channels.create.createShopFirst")}
                    </Link>{" "}
                    {t("channels.create.createShopFirstSuffix")}
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("channels.create.channelName")}</Label>
                <Input
                  type="text"
                  value={name}
                  onChange={(v) => setName(v)}
                  placeholder={t("channels.create.channelNamePlaceholder")}
                  required
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  {t("channels.create.channelNameHint")}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="size-4" />
                  {t("channels.create.maxParticipants")}
                </Label>
                <Input
                  type="number"
                  value={String(maxParticipants)}
                  onChange={(v) => setMaxParticipants(Number(v))}
                  min={2}
                />
                <p className="text-xs text-muted-foreground">
                  {t("channels.create.maxParticipantsHint")}
                </p>
              </div>

              <div className="flex items-center space-x-2 rounded-lg border border-border p-4">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="size-4 rounded border-input"
                />
                <Label
                  htmlFor="isPrivate"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Lock className="size-4" />
                  {t("channels.create.privateChannel")}
                </Label>
              </div>

              <Button
                type="submit"
                disabled={
                  createMutation.isPending ||
                  !userShops ||
                  userShops.length === 0
                }
                className="w-full"
              >
                <Plus className="size-4 mr-2" />
                {createMutation.isPending
                  ? t("channels.create.creating")
                  : t("channels.create.submit")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
