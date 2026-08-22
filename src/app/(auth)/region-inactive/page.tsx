"use client";

import { useEffect } from "react";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/features/auth/AuthProvider";

// Landed on whenever an API call comes back with error code REGION_INACTIVE
// (see src/lib/api-client.ts's response interceptor) — the user's region was
// deactivated by an admin. Tokens are deliberately left intact when routing
// here, so if the region gets reactivated the user doesn't need to log back in.
export default function RegionInactivePage() {
  const { logout } = useAuth();

  useEffect(() => {
    document.title = "Region deactivated — IRIS CRM";
  }, []);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <ShieldOff className="size-5" />
          </div>
          <CardTitle className="text-xl">Region deactivated</CardTitle>
          <CardDescription>
            Your region has been deactivated. Contact your administrator to restore access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" onClick={logout}>
            Log out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
