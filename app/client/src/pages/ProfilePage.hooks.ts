import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";
import { removeToken } from "@/lib/auth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export interface AddressFormData {
  label: string;
  street: string;
  street2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export const emptyAddress: AddressFormData = {
  label: "",
  street: "",
  street2: "",
  city: "",
  state: "",
  zipCode: "",
  country: "FR",
};

export function useProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  // ── Personal info state ──────────────────────────────────────────────────
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);

  // ── Avatar state ─────────────────────────────────────────────────────────
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Address dialog state ─────────────────────────────────────────────────
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState<AddressFormData>(emptyAddress);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<number | null>(null);

  // ── Payment dialog state ─────────────────────────────────────────────────
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  // ── Relay dialog state ───────────────────────────────────────────────────
  const [relayDialogOpen, setRelayDialogOpen] = useState(false);

  // ── Account deletion dialog state ────────────────────────────────────────
  const [blockersDialogOpen, setBlockersDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: profile, isLoading } = trpc.profile.me.useQuery(undefined, {
    onSuccess: (data) => {
      if (!profileLoaded) {
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setProfileLoaded(true);
      }
    },
  });

  const { data: paymentStatus } = trpc.payment.getPaymentStatus.useQuery();

  const deletionBlockers = trpc.auth.deletionBlockers.useQuery(undefined, {
    enabled: false,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      removeToken();
      window.location.href = "/";
    },
  });

  const deleteAccountMutation = trpc.auth.deleteAccount.useMutation();

  const handleDeleteAccount = async () => {
    try {
      await deleteAccountMutation.mutateAsync();
      removeToken();
      navigate("/");
    } catch {
      toast.error("Une erreur est survenue. Réessaie plus tard.");
    }
  };

  const handleRequestDelete = async () => {
    const result = await deletionBlockers.refetch();
    if ((result.data?.blockers.length ?? 0) > 0) {
      setBlockersDialogOpen(true);
    } else {
      setConfirmDialogOpen(true);
    }
  };

  const imageUpload = trpc.image.upload.useMutation();

  const updateAvatarMutation = trpc.profile.updateAvatar.useMutation({
    onSuccess: (_, input) => {
      toast.success("Avatar mis à jour");
      utils.profile.me.setData(undefined, (old) =>
        old ? { ...old, avatarUrl: input.avatarUrl } : old,
      );
      utils.profile.me.invalidate();
      setSelectedFile(null);
      setAvatarPreview(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la mise à jour de l'avatar");
    },
  });

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: (_, input) => {
      toast.success(t("profile.personalInfo.toastSuccess"));
      utils.profile.me.setData(undefined, (old) =>
        old
          ? {
              ...old,
              firstName: input.firstName ?? old.firstName,
              lastName: input.lastName ?? old.lastName,
            }
          : old,
      );
      utils.profile.me.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || t("profile.personalInfo.toastError"));
    },
  });

  const createAddress = trpc.profile.addresses.create.useMutation({
    onSuccess: (data) => {
      toast.success(t("profile.addresses.toastAdded"));
      utils.profile.me.setData(undefined, (old) =>
        old
          ? {
              ...old,
              addresses: [
                ...old.addresses,
                {
                  id: data.address.id,
                  label: data.address.label,
                  street: data.address.street,
                  street2: data.address.street2 ?? null,
                  city: data.address.city,
                  state: data.address.state,
                  zipCode: data.address.zipCode,
                  country: data.address.country,
                  isDefault: data.address.isDefault,
                  mondialRelayPointId: null,
                  createdAt: new Date(),
                },
              ],
            }
          : old,
      );
      utils.profile.me.invalidate();
      setAddressDialogOpen(false);
      setAddressForm(emptyAddress);
    },
    onError: (error) => {
      toast.error(error.message || t("profile.addresses.toastAddFailed"));
    },
  });

  const updateAddress = trpc.profile.addresses.update.useMutation({
    onSuccess: (data, input) => {
      toast.success(t("profile.addresses.toastUpdated"));
      utils.profile.me.setData(undefined, (old) =>
        old
          ? {
              ...old,
              addresses: old.addresses.map((a) =>
                a.id === input.id
                  ? {
                      ...a,
                      label: input.label ?? a.label,
                      street: input.street ?? a.street,
                      street2: input.street2 ?? a.street2,
                      city: input.city ?? a.city,
                      state: input.state ?? a.state,
                      zipCode: input.zipCode ?? a.zipCode,
                      country: input.country ?? a.country,
                      isDefault: data.address.isDefault,
                    }
                  : a,
              ),
            }
          : old,
      );
      utils.profile.me.invalidate();
      setAddressDialogOpen(false);
      setEditingAddress(null);
      setAddressForm(emptyAddress);
    },
    onError: (error) => {
      toast.error(error.message || t("profile.addresses.toastUpdateFailed"));
    },
  });

  const deleteAddress = trpc.profile.addresses.delete.useMutation({
    onSuccess: (_, input) => {
      toast.success(t("profile.addresses.toastDeleted"));
      utils.profile.me.setData(undefined, (old) =>
        old
          ? {
              ...old,
              addresses: old.addresses.filter((a) => a.id !== input.id),
            }
          : old,
      );
      utils.profile.me.invalidate();
      setDeleteDialogOpen(false);
      setAddressToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message || t("profile.addresses.toastDeleteFailed"));
    },
  });

  const deletePaymentMethod = trpc.payment.deletePaymentMethod.useMutation({
    onSuccess: (_, input) => {
      utils.payment.getPaymentStatus.setData(undefined, (old) =>
        old
          ? {
              ...old,
              paymentMethods: old.paymentMethods.filter(
                (pm) => pm.id !== input.paymentMethodId,
              ),
              hasPaymentMethod:
                old.paymentMethods.filter(
                  (pm) => pm.id !== input.paymentMethodId,
                ).length > 0,
            }
          : old,
      );
      utils.payment.getPaymentStatus.invalidate();
      toast.success("Moyen de paiement supprimé");
    },
    onError: (err) => {
      toast.error(err.message || "Erreur lors de la suppression");
    },
  });

  const saveRelayPoint = trpc.profile.addresses.saveRelayPoint.useMutation({
    onSuccess: (data, input) => {
      toast.success("Point relais enregistré");
      utils.profile.me.setData(undefined, (old) => {
        if (!old) return old;
        const withoutRelay = old.addresses.filter(
          (a) => a.mondialRelayPointId === null,
        );
        const updated = withoutRelay.map((a) => ({ ...a, isDefault: false }));
        return {
          ...old,
          addresses: [
            ...updated,
            {
              id: data.addressId,
              label: `Point Relais — ${input.name}`,
              street: input.street,
              street2: null,
              city: input.city,
              state: input.city,
              zipCode: input.zipCode,
              country: input.country ?? "FR",
              isDefault: true,
              mondialRelayPointId: input.relayPointId,
              createdAt: new Date(),
            },
          ],
        };
      });
      utils.profile.me.invalidate();
      setRelaySearchEnabled(false);
      setRelayPostcode("");
    },
    onError: (err) =>
      toast.error(err.message || "Erreur lors de l'enregistrement"),
  });

  const setDefaultAddress = trpc.profile.addresses.setDefault.useMutation({
    onSuccess: (_, input) => {
      toast.success(t("profile.addresses.toastDefaultSet"));
      utils.profile.me.setData(undefined, (old) =>
        old
          ? {
              ...old,
              addresses: old.addresses.map((a) => ({
                ...a,
                isDefault: a.id === input.id,
              })),
            }
          : old,
      );
      utils.profile.me.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || t("profile.addresses.toastDefaultFailed"));
    },
  });

  // ── Derived state ─────────────────────────────────────────────────────────
  const isAvatarUploading =
    imageUpload.isPending || updateAvatarMutation.isPending;

  // ── Handlers ──────────────────────────────────────────────────────────────
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

  const handleEditAddress = (address: {
    id: number;
    label: string;
    street: string;
    street2?: string | null;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }) => {
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
      updateAddress.mutate({ id: editingAddress, ...addressForm });
    } else {
      createAddress.mutate(addressForm);
    }
  };

  const confirmDelete = () => {
    if (addressToDelete) {
      deleteAddress.mutate({ id: addressToDelete });
    }
  };

  const handleReplaceWithManual = async () => {
    const existing = profile?.addresses[0];
    if (existing) {
      await deleteAddress.mutateAsync({ id: existing.id });
    }
    setEditingAddress(null);
    setAddressForm(emptyAddress);
    setAddressDialogOpen(true);
  };

  return {
    // State
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
    // Queries
    profile,
    isLoading,
    paymentStatus,
    // Mutations
    logoutMutation,
    updateProfile,
    createAddress,
    updateAddress,
    deleteAddress,
    deletePaymentMethod,
    saveRelayPoint,
    setDefaultAddress,
    // Derived
    isAvatarUploading,
    // Handlers
    handleFileSelect,
    handleAvatarSave,
    handleUpdateProfile,
    handleAddAddress,
    handleEditAddress,
    handleDeleteAddress,
    handleSubmitAddress,
    confirmDelete,
    handleReplaceWithManual,
    deleteAccountMutation,
    handleDeleteAccount,
    // Deletion blockers
    deletionBlockers,
    blockersDialogOpen,
    setBlockersDialogOpen,
    confirmDialogOpen,
    setConfirmDialogOpen,
    handleRequestDelete,
    // Utils
    utils,
  };
}
