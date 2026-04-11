import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Input from "@/components/ui/Input/Input";
import AddressAutocomplete, {
  BanSuggestion,
} from "@/components/AddressAutocomplete";
import { Label } from "@/components/ui/label";
import {
  User,
  MapPin,
  Plus,
  Trash2,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Camera,
  Save,
  Package,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { PaymentSetupDialog } from "@/components/PaymentSetupDialog";
import { cn } from "@/lib/utils";
import ButtonV2 from "@/components/ui/ButtonV2";
import Placeholder from "@/components/ui/Placeholder/Placeholder";
import EntityConfigurationCard from "@/components/ui/EntityConfigurationCard/EntityConfigurationCard";
import MondialRelayMapDialog from "@/components/MondialRelayMapDialog/MondialRelayMapDialog";
import { useProfile, emptyAddress } from "./ProfilePage.hooks";

export default function ProfilePage() {
  const { t } = useTranslation();
  const {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    avatarPreview,
    selectedFile,
    fileInputRef,
    addressDialogOpen,
    setAddressDialogOpen,
    editingAddress,
    setEditingAddress,
    addressForm,
    setAddressForm,
    deleteDialogOpen,
    setDeleteDialogOpen,
    paymentDialogOpen,
    setPaymentDialogOpen,
    relayDialogOpen,
    setRelayDialogOpen,
    profile,
    isLoading,
    paymentStatus,
    logoutMutation,
    updateProfile,
    createAddress,
    updateAddress,
    deleteAddress,
    deletePaymentMethod,
    saveRelayPoint,
    isAvatarUploading,
    handleFileSelect,
    handleAvatarSave,
    handleUpdateProfile,
    handleAddAddress,
    handleDeleteAddress,
    handleSubmitAddress,
    confirmDelete,
    handleReplaceWithManual,
    utils,
  } = useProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t("profile.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto pt-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("profile.title")}</h1>
        <p className="text-muted-foreground mt-2">{t("profile.subtitle")}</p>
      </div>
      <div className="flex flex-col gap-6">
        {/* Avatar */}
        <Card className={cn("bg-card", "border-border")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Camera className="size-5" />
              Avatar
            </CardTitle>
            <CardDescription>
              Votre photo de profil visible par les autres utilisateurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="shrink-0">
                {avatarPreview || profile?.avatarUrl ? (
                  <img
                    src={avatarPreview || profile?.avatarUrl || ""}
                    alt="Avatar"
                    className="size-20 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="size-20 rounded-full bg-muted flex items-center justify-center text-2xl font-outfit font-black uppercase text-muted-foreground">
                    {profile?.nickname?.[0] ?? <User className="size-8" />}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <ButtonV2
                  className={cn(
                    "border-2 border-dashed border-primary rounded-[12px]",
                    "text-primary text-[11px] font-bold",
                    "px-4",
                  )}
                  icon={<Camera />}
                  onClick={() => fileInputRef.current?.click()}
                  label="Changer mon avatar"
                />
                {selectedFile && (
                  <ButtonV2
                    className={cn(
                      "border-2 border-dashed border-primary rounded-[12px]",
                      "text-primary text-[11px] font-bold",
                      "bg-primary text-primary-foreground",
                      "px-4",
                    )}
                    icon={<Save />}
                    onClick={handleAvatarSave}
                    label={
                      isAvatarUploading
                        ? "Envoi en cours…"
                        : "Enregistrer l'avatar"
                    }
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5" />
              {t("profile.personalInfo.title")}
            </CardTitle>
            <CardDescription>
              {t("profile.personalInfo.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("profile.personalInfo.firstName")}</Label>
                  <Input
                    type="text"
                    value={firstName}
                    onChange={(v) => setFirstName(v)}
                    placeholder={t("profile.personalInfo.firstNamePlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("profile.personalInfo.lastName")}</Label>
                  <Input
                    type="text"
                    value={lastName}
                    onChange={(v) => setLastName(v)}
                    placeholder={t("profile.personalInfo.lastNamePlaceholder")}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("common.email")}</Label>
                <Input
                  type="text"
                  value={profile?.email || ""}
                  onChange={() => {}}
                  disabled
                  borderClassName="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  {t("profile.personalInfo.emailNote")}
                </p>
              </div>
              <ButtonV2
                type="submit"
                disabled={updateProfile.isPending}
                label={
                  updateProfile.isPending
                    ? t("profile.personalInfo.saveLoading")
                    : t("profile.personalInfo.save")
                }
                className="bg-b-primary text-txt-primary w-fit px-4"
              />
            </form>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <EntityConfigurationCard
          Icon={<CreditCard className="size-5" />}
          title={t("profile.payment.title")}
          description={t("profile.payment.description")}
          PlaceholderProps={{
            Icon: <AlertCircle className="size-10" />,
            title: t("profile.payment.noMethod"),
            ButtonListProps: [
              {
                icon: <CreditCard className="size-4" />,
                label: t("profile.payment.addMethod"),
                onClick: () => setPaymentDialogOpen(true),
                className: "bg-primary text-primary-foreground",
              },
            ],
          }}
        >
          {paymentStatus?.hasPaymentMethod ? (
            <div className="space-y-3">
              {paymentStatus.paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-center gap-3 border rounded-lg p-3"
                >
                  <CheckCircle2 className="size-5 text-success shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium capitalize">
                      {pm.wallet
                        ? pm.wallet.replace("_", " ")
                        : pm.card
                          ? `${pm.card.brand} •••• ${pm.card.last4}`
                          : pm.type}
                    </p>
                    {pm.card && !pm.wallet && (
                      <p className="text-xs text-muted-foreground">
                        Expires {pm.card.expMonth}/{pm.card.expYear}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary">
                    {t("profile.payment.active")}
                  </Badge>
                  <button
                    className="shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-50"
                    disabled={deletePaymentMethod.isPending}
                    onClick={() =>
                      deletePaymentMethod.mutate({ paymentMethodId: pm.id })
                    }
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              <ButtonV2
                className="border border-border bg-background text-foreground w-full mt-2"
                onClick={() => setPaymentDialogOpen(true)}
                label={t("profile.payment.change")}
              />
            </div>
          ) : undefined}
        </EntityConfigurationCard>

        <PaymentSetupDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          onSuccess={() => {
            utils.payment.getPaymentStatus.invalidate();
          }}
        />

        {/* Delivery Address */}
        <EntityConfigurationCard
          Icon={<MapPin className="size-5" />}
          title="Adresse de livraison"
          description="Choisissez comment vous souhaitez recevoir vos commandes"
          PlaceholderProps={{
            Icon: <MapPin className="size-10" />,
            title: t("profile.addresses.empty"),
            ButtonListProps: [
              {
                icon: <MapPin className="size-4" />,
                label: "Ajouter une adresse à la main",
                onClick: handleAddAddress,
                className: "border border-border bg-background text-foreground",
              },
              {
                icon: <Package className="size-4" />,
                label: "Choisir avec Mondial Relay",
                onClick: () => setRelayDialogOpen(true),
                className: "border border-border bg-background text-foreground",
              },
            ],
          }}
        >
          {(profile?.addresses.length ?? 0) > 0
            ? (() => {
                const address = profile!.addresses[0];
                return (
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <p className="font-semibold">{address.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {address.street}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {address.city}, {address.zipCode}
                      </p>
                    </div>
                    <ButtonV2
                      icon={<MapPin className="size-4" />}
                      label="Ajouter une adresse à la main"
                      onClick={handleReplaceWithManual}
                      className="border border-border bg-background text-foreground w-full"
                    />
                    <ButtonV2
                      icon={<Package className="size-4" />}
                      label="Choisir avec Mondial Relay"
                      onClick={() => setRelayDialogOpen(true)}
                      className="border border-border bg-background text-foreground w-full"
                    />
                    <button
                      onClick={() => handleDeleteAddress(address.id)}
                      className="text-destructive text-sm flex items-center gap-1 mx-auto"
                    >
                      <Trash2 className="size-3" /> Supprimer l'adresse
                    </button>
                  </div>
                );
              })()
            : undefined}
        </EntityConfigurationCard>
      </div>

      <MondialRelayMapDialog
        open={relayDialogOpen}
        onOpenChange={setRelayDialogOpen}
        onSave={(point) =>
          saveRelayPoint.mutate({
            relayPointId: point.id,
            name: point.name,
            street: point.address,
            city: point.city,
            zipCode: point.zipCode,
            country: point.country,
          })
        }
      />

      {/* Sign out */}
      <div className="mt-6 pb-4">
        <ButtonV2
          icon={<LogOut className="size-4" />}
          label={logoutMutation.isPending ? "Déconnexion…" : "Se déconnecter"}
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="w-full border border-destructive bg-background text-destructive hover:bg-destructive hover:text-destructive-foreground"
        />
      </div>

      {/* Address Dialog */}
      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAddress
                ? t("profile.addresses.dialogTitleEdit")
                : t("profile.addresses.dialogTitleAdd")}
            </DialogTitle>
            <DialogDescription>
              {t("profile.addresses.dialogDescription")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitAddress} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("profile.addresses.autocomplete")}</Label>
              <AddressAutocomplete
                placeholder={t("profile.addresses.autocompletePlaceholder")}
                onSelect={(s: BanSuggestion) =>
                  setAddressForm((prev) => ({
                    ...prev,
                    street: s.street,
                    city: s.city,
                    zipCode: s.zipCode,
                    state: s.state,
                    country: s.country,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("profile.addresses.label")}</Label>
              <Input
                type="text"
                value={addressForm.label}
                onChange={(v) => setAddressForm({ ...addressForm, label: v })}
                placeholder={t("profile.addresses.labelPlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("profile.addresses.street")}</Label>
              <Input
                type="text"
                value={addressForm.street}
                onChange={(v) => setAddressForm({ ...addressForm, street: v })}
                placeholder={t("profile.addresses.streetPlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("profile.addresses.street2")}</Label>
              <Input
                type="text"
                value={addressForm.street2}
                onChange={(v) => setAddressForm({ ...addressForm, street2: v })}
                placeholder={t("profile.addresses.street2Placeholder")}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("profile.addresses.city")}</Label>
                <Input
                  type="text"
                  value={addressForm.city}
                  onChange={(v) => setAddressForm({ ...addressForm, city: v })}
                  placeholder={t("profile.addresses.cityPlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("profile.addresses.state")}</Label>
                <Input
                  type="text"
                  value={addressForm.state}
                  onChange={(v) => setAddressForm({ ...addressForm, state: v })}
                  placeholder={t("profile.addresses.statePlaceholder")}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("profile.addresses.zipCode")}</Label>
                <Input
                  type="text"
                  value={addressForm.zipCode}
                  onChange={(v) =>
                    setAddressForm({ ...addressForm, zipCode: v })
                  }
                  placeholder={t("profile.addresses.zipCodePlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("profile.addresses.country")}</Label>
                <Input
                  type="text"
                  value={addressForm.country}
                  onChange={(v) =>
                    setAddressForm({ ...addressForm, country: v })
                  }
                  placeholder={t("profile.addresses.countryPlaceholder")}
                  maxLength={2}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <ButtonV2
                type="button"
                className="border border-border bg-background text-foreground"
                onClick={() => {
                  setAddressDialogOpen(false);
                  setEditingAddress(null);
                  setAddressForm(emptyAddress);
                }}
                label={t("profile.addresses.cancel")}
              />
              <ButtonV2
                type="submit"
                disabled={createAddress.isPending || updateAddress.isPending}
                className="bg-primary text-primary-foreground"
                label={
                  editingAddress
                    ? updateAddress.isPending
                      ? t("profile.addresses.saveLoading")
                      : t("profile.addresses.saveChanges")
                    : createAddress.isPending
                      ? t("profile.addresses.addLoading")
                      : t("profile.addresses.addSubmit")
                }
              />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("profile.addresses.deleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("profile.addresses.deleteDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("profile.addresses.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("profile.addresses.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
