import { useState, FormEvent, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Video, Lock, Users, ArrowLeft, Store } from "lucide-react";
import { trpc } from "../lib/trpc";
import { isAuthenticated } from "../lib/auth";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Label from "../components/ui/Label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../components/ui/Card";

export default function CreateChannelPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    }
  }, [navigate]);

  const createMutation = trpc.channel.create.useMutation({
    onSuccess: (data) => {
      navigate(`/channel/${data.channel.id}`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (name.length < 3) {
      setError("Channel name must be at least 3 characters");
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
          <Link to="/channels">
            <ArrowLeft className="size-4 mr-2" />
            Back to channels
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="size-6" />
              Create Live Channel
            </CardTitle>
            <CardDescription>
              Start a new live video/audio channel
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive text-destructive text-sm">
                <p>{error}</p>
                {error.includes("shop") && (
                  <p className="mt-2">
                    <Link to="/shops" className="underline font-medium">
                      Create a shop first
                    </Link>{" "}
                    to start creating channels.
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Channel Name</Label>
                <Input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Awesome Stream"
                  required
                  minLength={3}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  Choose a descriptive name for your channel (3-100 characters)
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="maxParticipants"
                  className="flex items-center gap-2"
                >
                  <Users className="size-4" />
                  Max Participants
                </Label>
                <Input
                  type="number"
                  id="maxParticipants"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  min={2}
                  max={50}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of participants (2-50)
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
                  Make this channel private
                </Label>
              </div>

              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full"
              >
                <Plus className="size-4 mr-2" />
                {createMutation.isPending ? "Creating..." : "Create Channel"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
