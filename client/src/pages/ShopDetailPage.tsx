import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { ArrowLeft, Edit2, Save, X, Plus, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import VendorList from "../components/VendorList/VendorList";
import AddVendorModal from "../components/AddVendorModal/AddVendorModal";

export default function ShopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate(); // Keep for delete redirect
  const shopId = parseInt(id || "0");

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showAddVendor, setShowAddVendor] = useState(false);

  const { data: shop, isLoading } = trpc.shop.get.useQuery(
    { shopId },
    {
      enabled: shopId > 0,
      onSuccess: (data) => {
        setName(data.name);
        setDescription(data.description || "");
      },
    },
  );

  const utils = trpc.useUtils();

  const updateShopMutation = trpc.shop.update.useMutation({
    onSuccess: () => {
      toast.success("Shop updated successfully");
      setIsEditing(false);
      utils.shop.get.invalidate({ shopId });
      utils.shop.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update shop");
    },
  });

  const deleteShopMutation = trpc.shop.delete.useMutation({
    onSuccess: () => {
      toast.success("Shop deleted successfully");
      navigate("/shops");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete shop");
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Shop name is required");
      return;
    }

    updateShopMutation.mutate({
      shopId,
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  const handleDelete = () => {
    if (
      window.confirm(
        "Are you sure you want to delete this shop? This action cannot be undone.",
      )
    ) {
      deleteShopMutation.mutate({ shopId });
    }
  };

  const handleCancel = () => {
    if (shop) {
      setName(shop.name);
      setDescription(shop.description || "");
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading shop...</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Shop not found</p>
      </div>
    );
  }

  const isOwner = shop.role === "shop-owner";

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" className="mb-6" asChild>
        <Link to="/shops">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Shops
        </Link>
      </Button>

      <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Shop Name *</Label>
                  <Input
                    id="edit-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter shop name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your shop"
                    rows={4}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{shop.name}</h1>
                  {shop.role === "shop-owner" && (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded">
                      Owner
                    </span>
                  )}
                  {shop.role === "vendor" && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                      Vendor
                    </span>
                  )}
                </div>
                {shop.description && (
                  <p className="text-gray-600">{shop.description}</p>
                )}
              </>
            )}
          </div>

          {isOwner && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={updateShopMutation.isPending}
                    size="sm"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button variant="outline" onClick={handleCancel} size="sm">
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  size="sm"
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-6 border-t">
          <Link to={`/shops/${shopId}/products`}>
            <Button variant="outline">
              <Package className="mr-2 h-4 w-4" />
              Manage Products
            </Button>
          </Link>
          {isOwner && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteShopMutation.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Shop
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Vendors</h2>
          {isOwner && (
            <Button onClick={() => setShowAddVendor(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          )}
        </div>

        <VendorList shopId={shopId} isOwner={isOwner} />
      </div>

      {showAddVendor && (
        <AddVendorModal
          shopId={shopId}
          onClose={() => setShowAddVendor(false)}
        />
      )}
    </div>
  );
}
