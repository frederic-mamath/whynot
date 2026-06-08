/* eslint-disable @typescript-eslint/no-floating-promises -- TODO: removed by ticket-006 */
import { useState } from "react";
import { useRouter } from "expo-router";
import { trpc } from "@/lib/trpc";
import { AddressForm, AddressFormValues } from "@/components/AddressForm";

export default function NewAddressScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [error, setError] = useState<string | null>(null);

  const createMutation = trpc.profile.addresses.create.useMutation({
    onSuccess: () => {
      utils.profile.addresses.list.invalidate();
      utils.profile.me.invalidate();
      router.back();
    },
    onError: (e) => setError(e.message),
  });

  const handleSubmit = (values: AddressFormValues) => {
    setError(null);
    createMutation.mutate({
      label: values.label,
      street: values.street,
      street2: values.street2 || undefined,
      city: values.city,
      state: values.city,
      zipCode: values.zipCode,
      country: "FR",
      isDefault: values.isDefault,
    });
  };

  return (
    <AddressForm
      submitLabel="Enregistrer"
      isPending={createMutation.isPending}
      errorMessage={error}
      onSubmit={handleSubmit}
    />
  );
}
