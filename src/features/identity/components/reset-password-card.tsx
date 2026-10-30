"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Eye, EyeOff, KeyRound, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useResetUserPassword } from "@/features/identity/hooks";
import { getApiErrorMessage } from "@/lib/api-client";

const MIN_LENGTH = 8;
// No look-alike characters (0/O, 1/l/I) so a generated password can be read
// out or typed by hand without mistakes.
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%&*";

function generatePassword(length = 12) {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => CHARSET[v % CHARSET.length]).join("");
}

// Passwords are stored hashed, so the current one can't be shown — this sets
// a new one. The field has a show/hide toggle so the admin can see exactly
// what they're setting and copy it to share with the user.
export function ResetPasswordCard({ userId, userName }: { userId: string; userName: string }) {
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const resetPassword = useResetUserPassword(userId);

  const tooShort = password.length > 0 && password.length < MIN_LENGTH;

  function onGenerate() {
    setPassword(generatePassword());
    setVisible(true);
  }

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(password);
      toast.success("Password copied");
    } catch {
      toast.error("Couldn't copy — select and copy it manually");
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < MIN_LENGTH) return;
    try {
      await resetPassword.mutateAsync(password);
      toast.success(`Password updated for ${userName}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="size-4 text-primary" />
          Password
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          <p className="text-xs text-muted-foreground">
            The current password is stored encrypted and can&apos;t be viewed. Set a new one below and
            share it with {userName}.
          </p>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="newPassword"
                  type={visible ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={`At least ${MIN_LENGTH} characters`}
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setVisible((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground hover:text-foreground"
                  aria-label={visible ? "Hide password" : "Show password"}
                >
                  {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <Button type="button" variant="outline" onClick={onGenerate}>
                <Wand2 className="size-3.5" />
                Generate
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={onCopy} disabled={!password} aria-label="Copy password">
                <Copy className="size-3.5" />
              </Button>
            </div>
            {tooShort ? (
              <p className="text-sm text-destructive">Password must be at least {MIN_LENGTH} characters</p>
            ) : null}
          </div>
          <Button type="submit" disabled={resetPassword.isPending || password.length < MIN_LENGTH}>
            {resetPassword.isPending ? "Updating…" : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
