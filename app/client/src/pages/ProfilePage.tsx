import { useState } from "react";
import { trpc } from "@/lib/trpc";
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
import { User, MapPin, Plus, Pencil, Trash2, Star } from "lucide-react";
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState<AddressFormData>(emptyAddress);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<number | null>(null);

  const utils = trpc.useUtils();

  // Load profile
  const { data: profile, isLoading } = trpc.profile.me.useQuery(undefined, {
    onSuccess: (data) => {
      if (!profileLoaded) {
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setProfileLoaded(true);
      }
    },
  });

  // Update profile mutation
  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
      utils.profile.me.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  // Create address mutation
  const createAddress = trpc.profile.addresses.create.useMutation({
    onSuccess: () => {
      toast.success("Address added successfully");
      utils.profile.me.invalidate();
      setAddressDialogOpen(false);
      setAddressForm(emptyAddress);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add address");
    },
  });

  // Update address mutation
  const updateAddress = trpc.profile.addresses.update.useMutation({
    onSuccess: () => {
      toast.success("Address updated successfully");
      utils.profile.me.invalidate();
      setAddressDialogOpen(false);
      setEditingAddress(null);
      setAddressForm(emptyAddress);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update address");
    },
  });

  // Delete address mutation
  const deleteAddress = trpc.profile.addresses.delete.useMutation({
    onSuccess: () => {
      toast.success("Address deleted successfully");
      utils.profile.me.invalidate();
      setDeleteDialogOpen(false);
      setAddressToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete address");
    },
  });

  // Set default address mutation
  const setDefaultAddress = trpc.profile.addresses.setDefault.useMutation({
    onSuccess: () => {
      toast.success("Default address updated");
      utils.profile.me.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to set default address");
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
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your personal information and delivery addresses
        </p>
      </div>

      {/* Personal Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Update your name and contact details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Delivery Addresses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="size-5" />
                Delivery Addresses
              </CardTitle>
              <CardDescription>
                Manage your shipping addresses for orders
              </CardDescription>
            </div>
            <Button onClick={handleAddAddress}>
              <Plus className="size-4 mr-2" />
              Add Address
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {profile?.addresses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="size-12 mx-auto mb-3 opacity-50" />
              <p>No addresses added yet</p>
              <p className="text-sm mt-1">
                Add an address to complete your profile
              </p>
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
                            Default
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

      {/* Address Dialog */}
      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Edit Address" : "Add New Address"}
            </DialogTitle>
            <DialogDescription>
              Enter your delivery address details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitAddress} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={addressForm.label}
                onChange={(e) =>
                  setAddressForm({ ...addressForm, label: e.target.value })
                }
                placeholder="e.g., Home, Work"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={addressForm.street}
                onChange={(e) =>
                  setAddressForm({ ...addressForm, street: e.target.value })
                }
                placeholder="123 Main St"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="street2">Apt, Suite (optional)</Label>
              <Input
                id="street2"
                value={addressForm.street2}
                onChange={(e) =>
                  setAddressForm({ ...addressForm, street2: e.target.value })
                }
                placeholder="Apt 4B"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={addressForm.city}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, city: e.target.value })
                  }
                  placeholder="New York"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={addressForm.state}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, state: e.target.value })
                  }
                  placeholder="NY"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={addressForm.zipCode}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, zipCode: e.target.value })
                  }
                  placeholder="10001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={addressForm.country}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, country: e.target.value })
                  }
                  placeholder="US"
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
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createAddress.isPending || updateAddress.isPending}
              >
                {editingAddress
                  ? updateAddress.isPending
                    ? "Saving..."
                    : "Save Changes"
                  : createAddress.isPending
                    ? "Adding..."
                    : "Add Address"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
