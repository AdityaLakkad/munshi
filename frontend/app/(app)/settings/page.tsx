"use client";

import { ChangePasswordForm } from "@/components/forms/change-password-form";
import { FirmProfileForm } from "@/components/forms/firm-profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamTable } from "@/components/team-table";
import { useAuth } from "@/lib/auth";

export default function SettingsPage() {
  const { user } = useAuth();
  const isFirmAdmin = user?.role === "firm_admin";

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>

      {isFirmAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Firm profile</CardTitle>
            <CardDescription>Your firm's name and currency, shown across the app.</CardDescription>
          </CardHeader>
          <CardContent>
            <FirmProfileForm />
          </CardContent>
        </Card>
      )}

      {isFirmAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team</CardTitle>
            <CardDescription>Staff can record entries; Viewers are read-only. Only Firm Admins can manage the team.</CardDescription>
          </CardHeader>
          <CardContent>
            <TeamTable />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Password</CardTitle>
          <CardDescription>Change the password for your own account.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
