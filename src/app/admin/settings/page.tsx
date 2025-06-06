import AdminLayout from "../layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings2, ShieldCheck, Palette } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6 py-6 max-w-3xl mx-auto">
        <div className="flex items-center space-x-3 mb-2">
            <Settings2 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-headline text-primary">Admin Settings</h1>
        </div>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><ShieldCheck className="mr-2 h-5 w-5 text-primary" /> Security Settings</CardTitle>
            <CardDescription className="font-body">Manage admin account security and preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="font-semibold">Admin Email</Label>
              <Input id="admin-email" type="email" defaultValue="admin@stickerverse.local" disabled />
              <p className="text-xs text-muted-foreground">Currently using static admin profile.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Change Password</Label>
              <Input id="admin-password" type="password" placeholder="New Password" />
              <Input id="admin-confirm-password" type="password" placeholder="Confirm New Password" />
              <Button variant="outline" disabled>Update Password (Disabled for static admin)</Button>
            </div>
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="space-y-0.5">
                    <Label htmlFor="mfa" className="text-base">Two-Factor Authentication (2FA)</Label>
                    <p className="text-sm text-muted-foreground">
                        Enhance your account security by enabling 2FA.
                    </p>
                </div>
                <Switch id="mfa" aria-label="Toggle 2FA" disabled />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><Palette className="mr-2 h-5 w-5 text-primary" /> Appearance Settings</CardTitle>
            <CardDescription className="font-body">Customize the look and feel of the admin panel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <Switch id="dark-mode" disabled />
            </div>
             <p className="text-sm text-muted-foreground">More appearance settings coming soon!</p>
          </CardContent>
        </Card>

      </div>
    </AdminLayout>
  );
}
