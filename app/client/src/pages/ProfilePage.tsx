import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { removeToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  User,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Star,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Camera,
  Save,
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

interface AddressFormData {
  label: string;
  street: string;
  street2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

const emptyAddress: AddressFormData = {
  label: "",
  street: "",
  street2: "",
  city: "",
  state: "",
  zipCode: "",
  country: "US",
};

export default function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState<AddressFormData>(emptyAddress);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<number | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const utils = trpc.useUtils();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      removeToken();
      navigate("/");
    },
  });

  // Load profile
  const { data: profile, isLoading } = trpc.profile.me.useQuery();

  // Load payment status
  const { data: paymentStatus } = trpc.payment.getPaymentStatus.useQuery();

  // Populate form state from DB data (only on initial load)
  useEffect(() => {
    if (profile && !profileLoaded) {
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
      setProfileLoaded(true);
    }
  }, [profile, profileLoaded]);

  // Upload avatar mutation (image upload + profile update chained)
  const imageUpload = trpc.image.upload.useMutation();
  const updateAvatarMutation = trpc.profile.updateAvatar.useMutation({
    onSuccess: () => {
      toast.success("Avatar mis à jour");
      utils.profile.me.invalidate();
      setSelectedFile(null);
      setAvatarPreview(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la mise à jour de l'avatar");
    },
  });

  const isAvatarUploading =
    imageUpload.isPending || updateAvatarMutation.isPending;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarSave = async () => {
    if (!selectedFile) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      try {
        const { url, publicId } = await imageUpload.mutateAsync({ base64 });
        await updateAvatarMutation.mutateAsync({
          avatarUrl: url,
          avatarPublicId: publicId,
        });
      } catch {
        // errors handled by mutation callbacks
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  // Update profile mutation
  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success(t("profile.personalInfo.toastSuccess"));
      utils.profile.me.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || t("profile.personalInfo.toastError"));
    },
  });

  // Create address mutation
  const createAddress = trpc.profile.addresses.create.useMutation({
    onSuccess: () => {
      toast.success(t("profile.addresses.toastAdded"));
      utils.profile.me.invalidate();
      setAddressDialogOpen(false);
      setAddressForm(emptyAddress);
    },
    onError: (error) => {
      toast.error(error.message || t("profile.addresses.toastAddFailed"));
    },
  });

  // Update address mutation
  const updateAddress = trpc.profile.addresses.update.useMutation({
    onSuccess: () => {
      toast.success(t("profile.addresses.toastUpdated"));
      utils.profile.me.invalidate();
      setAddressDialogOpen(false);
      setEditingAddress(null);
      setAddressForm(emptyAddress);
    },
    onError: (error) => {
      toast.error(error.message || t("profile.addresses.toastUpdateFailed"));
    },
  });

  // Delete address mutation
  const deleteAddress = trpc.profile.addresses.delete.useMutation({
    onSuccess: () => {
      toast.success(t("profile.addresses.toastDeleted"));
      utils.profile.me.invalidate();
      setDeleteDialogOpen(false);
      setAddressToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message || t("profile.addresses.toastDeleteFailed"));
    },
  });

  // Set default address mutation
  const setDefaultAddress = trpc.profile.addresses.setDefault.useMutation({
    onSuccess: () => {
      toast.success(t("profile.addresses.toastDefaultSet"));
      utils.profile.me.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || t("profile.addresses.toastDefaultFailed"));
    },
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({
      firstName: firstName || undefined,
      lastName: lastName || undefined,
    });
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setAddressForm(emptyAddress);
    setAddressDialogOpen(true);
  };

  const handleEditAddress = (address: any) => {
    setEditingAddress(address.id);
    setAddressForm({
      label: address.label,
      street: address.street,
      street2: address.street2 || "",
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
    });
    setAddressDialogOpen(true);
  };

  const handleDeleteAddress = (id: number) => {
    setAddressToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleSubmitAddress = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingAddress) {
      updateAddress.mutate({
        id: editingAddress,
        ...addressForm,
      });
    } else {
      createAddress.mutate(addressForm);
    }
  };

  const confirmDelete = () => {
    if (addressToDelete) {
      deleteAddress.mutate({ id: addressToDelete });
    }
  };

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
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("profile.title")}</h1>
        <p className="text-muted-foreground mt-2">{t("profile.subtitle")}</p>
      </div>

      {/* Avatar */}
      <Card className={cn("mb-6", "bg-fourth", "border-divider")}>
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
            {/* Preview */}
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

            {/* Actions */}
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
      <Card className="mb-6">
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
                <Label htmlFor="firstName">
                  {t("profile.personalInfo.firstName")}
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t("profile.personalInfo.firstNamePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  {t("profile.personalInfo.lastName")}
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t("profile.personalInfo.lastNamePlaceholder")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("common.email")}</Label>
              <Input
                id="email"
                value={profile?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                {t("profile.personalInfo.emailNote")}
              </p>
            </div>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending
                ? t("profile.personalInfo.saveLoading")
                : t("profile.personalInfo.save")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-5" />
                {t("profile.payment.title")}
              </CardTitle>
              <CardDescription>
                {t("profile.payment.description")}
              </CardDescription>
            </div>
            {paymentStatus?.hasPaymentMethod && (
              <Button
                variant="outline"
                onClick={() => setPaymentDialogOpen(true)}
              >
                {t("profile.payment.change")}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {paymentStatus?.hasPaymentMethod ? (
            <div className="space-y-3">
              {paymentStatus.paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-center gap-3 border rounded-lg p-3"
                >
                  <CheckCircle2 className="size-5 text-green-500 shrink-0" />
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
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircle className="size-10 mx-auto mb-3 text-amber-500 opacity-70" />
              <p className="text-sm font-medium">
                {t("profile.payment.noMethod")}
              </p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                {t("profile.payment.noMethodHint")}
              </p>
              <Button onClick={() => setPaymentDialogOpen(true)}>
                <CreditCard className="size-4 mr-2" />
                {t("profile.payment.addMethod")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentSetupDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        onSuccess={() => {
          utils.payment.getPaymentStatus.invalidate();
        }}
      />

      {/* Delivery Addresses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="size-5" />
                {t("profile.addresses.title")}
              </CardTitle>
              <CardDescription>
                {t("profile.addresses.description")}
              </CardDescription>
            </div>
            <Button onClick={handleAddAddress}>
              <Plus className="size-4 mr-2" />
              {t("profile.addresses.add")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {profile?.addresses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="size-12 mx-auto mb-3 opacity-50" />
              <p>{t("profile.addresses.empty")}</p>
              <p className="text-sm mt-1">{t("profile.addresses.emptyHint")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {profile?.addresses.map((address) => (
                <div
                  key={address.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{address.label}</h4>
                        {address.isDefault && (
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            <Star className="size-3 fill-current" />
                            {t("profile.addresses.default")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {address.street}
                        {address.street2 && `, ${address.street2}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {address.city}, {address.state} {address.zipCode}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {address.country}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!address.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setDefaultAddress.mutate({ id: address.id })
                          }
                          disabled={setDefaultAddress.isPending}
                        >
                          <Star className="size-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditAddress(address)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAddress(address.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sign out */}
      <div className="mt-6 pb-4">
        <Button
          variant="outline"
          className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="size-4 mr-2" />
          {logoutMutation.isPending ? "Déconnexion…" : "Se déconnecter"}
        </Button>
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
              <Label htmlFor="label">{t("profile.addresses.label")}</Label>
              <Input
                id="label"
                value={addressForm.label}
                onChange={(e) =>
                  setAddressForm({ ...addressForm, label: e.target.value })
                }
                placeholder={t("profile.addresses.labelPlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="street">{t("profile.addresses.street")}</Label>
              <Input
                id="street"
                value={addressForm.street}
                onChange={(e) =>
                  setAddressForm({ ...addressForm, street: e.target.value })
                }
                placeholder={t("profile.addresses.streetPlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="street2">{t("profile.addresses.street2")}</Label>
              <Input
                id="street2"
                value={addressForm.street2}
                onChange={(e) =>
                  setAddressForm({ ...addressForm, street2: e.target.value })
                }
                placeholder={t("profile.addresses.street2Placeholder")}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">{t("profile.addresses.city")}</Label>
                <Input
                  id="city"
                  value={addressForm.city}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, city: e.target.value })
                  }
                  placeholder={t("profile.addresses.cityPlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">{t("profile.addresses.state")}</Label>
                <Input
                  id="state"
                  value={addressForm.state}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, state: e.target.value })
                  }
                  placeholder={t("profile.addresses.statePlaceholder")}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipCode">
                  {t("profile.addresses.zipCode")}
                </Label>
                <Input
                  id="zipCode"
                  value={addressForm.zipCode}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, zipCode: e.target.value })
                  }
                  placeholder={t("profile.addresses.zipCodePlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">
                  {t("profile.addresses.country")}
                </Label>
                <Input
                  id="country"
                  value={addressForm.country}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, country: e.target.value })
                  }
                  placeholder={t("profile.addresses.countryPlaceholder")}
                  maxLength={2}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAddressDialogOpen(false);
                  setEditingAddress(null);
                  setAddressForm(emptyAddress);
                }}
              >
                {t("profile.addresses.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={createAddress.isPending || updateAddress.isPending}
              >
                {editingAddress
                  ? updateAddress.isPending
                    ? t("profile.addresses.saveLoading")
                    : t("profile.addresses.saveChanges")
                  : createAddress.isPending
                    ? t("profile.addresses.addLoading")
                    : t("profile.addresses.addSubmit")}
              </Button>
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
