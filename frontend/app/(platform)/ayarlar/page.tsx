"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Mail,
  Moon,
  Palette,
  Shield,
  Trash2,
  Trophy,
  User,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/providers/auth-provider";
import { useNightMode } from "@/providers/night-mode-provider";
import { getSettings, updateSettings, deleteAccount } from "@/lib/api/settings";
import type { UserSettings, AchievementPrivacy, ThemePreference } from "@/lib/api/types";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { refreshNightMode } = useNightMode();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      toast.error("Ayarlar yüklenirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSetting = async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const updated = await updateSettings({ [key]: value });
      setSettings(updated);
      toast.success("Ayar güncellendi");

      // Refresh night mode context if night mode settings changed
      if (key === "nightModeEnabled" || key === "nightModeNotifications") {
        refreshNightMode();
      }
    } catch (error) {
      toast.error("Ayar güncellenirken bir hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      toast.success("Hesabınız silindi");
      await logout();
    } catch (error) {
      toast.error("Hesap silinirken bir hata oluştu");
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-muted-foreground text-xs tracking-[0.32em] uppercase">
          Sistem
        </p>
        <h1 className="text-2xl font-semibold tracking-[-0.04em]">Ayarlar</h1>
        <p className="text-muted-foreground mt-1">
          Bildirimler, güvenlik tercihleri ve deneyim ayarlarını yönetin.
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Profil Bilgileri</CardTitle>
          </div>
          <CardDescription>
            Profil bilgilerinizi düzenlemek için profil sayfasına gidin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" onClick={() => router.push("/profil")}>
              Profili Düzenle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Bildirim Tercihleri</CardTitle>
          </div>
          <CardDescription>
            Hangi bildirimleri almak istediğinizi seçin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <Label htmlFor="push-notifications" className="font-medium">
                  Push Bildirimleri
                </Label>
                <p className="text-sm text-muted-foreground">
                  Tarayıcı bildirimlerini etkinleştir
                </p>
              </div>
            </div>
            <Switch
              id="push-notifications"
              checked={settings?.pushNotifications}
              onCheckedChange={(checked) =>
                handleUpdateSetting("pushNotifications", checked)
              }
              disabled={isSaving}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <Label htmlFor="email-notifications" className="font-medium">
                  Email Bildirimleri
                </Label>
                <p className="text-sm text-muted-foreground">
                  Önemli güncellemeleri email ile al
                </p>
              </div>
            </div>
            <Switch
              id="email-notifications"
              checked={settings?.emailNotifications}
              onCheckedChange={(checked) =>
                handleUpdateSetting("emailNotifications", checked)
              }
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Night Mode Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Gece Mesaisi</CardTitle>
            <Badge variant="secondary" className="ml-2">23:00 - 02:00</Badge>
          </div>
          <CardDescription>
            Gece çalışma modu ayarlarını yapılandırın.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Moon className="h-4 w-4" />
              </div>
              <div>
                <Label htmlFor="night-mode" className="font-medium">
                  Gece Mesaisi Modu
                </Label>
                <p className="text-sm text-muted-foreground">
                  23:00-02:00 arası otomatik aktif olur, 1.5x bonus puan
                </p>
              </div>
            </div>
            <Switch
              id="night-mode"
              checked={settings?.nightModeEnabled}
              onCheckedChange={(checked) =>
                handleUpdateSetting("nightModeEnabled", checked)
              }
              disabled={isSaving}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <Label htmlFor="night-notifications" className="font-medium">
                  Gece Bildirimleri
                </Label>
                <p className="text-sm text-muted-foreground">
                  Gece mesaisi saatlerinde bildirim al
                </p>
              </div>
            </div>
            <Switch
              id="night-notifications"
              checked={settings?.nightModeNotifications}
              onCheckedChange={(checked) =>
                handleUpdateSetting("nightModeNotifications", checked)
              }
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Achievement Privacy */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Başarı Müzesi Gizliliği</CardTitle>
          </div>
          <CardDescription>
            Başarılarınızın kimler tarafından görülebileceğini seçin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings?.achievementPrivacy}
            onValueChange={(value) =>
              handleUpdateSetting("achievementPrivacy", value as AchievementPrivacy)
            }
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
              <RadioGroupItem value="PUBLIC" id="privacy-public" />
              <Label htmlFor="privacy-public" className="flex-1 cursor-pointer">
                <div className="font-medium">Herkese Açık</div>
                <div className="text-sm text-muted-foreground">
                  Tüm kullanıcılar başarılarınızı görebilir
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
              <RadioGroupItem value="FRIENDS" id="privacy-friends" />
              <Label htmlFor="privacy-friends" className="flex-1 cursor-pointer">
                <div className="font-medium">Sadece Arkadaşlar</div>
                <div className="text-sm text-muted-foreground">
                  Sadece arkadaşlarınız başarılarınızı görebilir
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
              <RadioGroupItem value="PRIVATE" id="privacy-private" />
              <Label htmlFor="privacy-private" className="flex-1 cursor-pointer">
                <div className="font-medium">Gizli</div>
                <div className="text-sm text-muted-foreground">
                  Sadece siz görebilirsiniz
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Tema Tercihi</CardTitle>
          </div>
          <CardDescription>
            Uygulama temasını seçin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings?.theme}
            onValueChange={(value) =>
              handleUpdateSetting("theme", value as ThemePreference)
            }
            className="grid grid-cols-3 gap-4"
          >
            <div>
              <RadioGroupItem
                value="DARK"
                id="theme-dark"
                className="peer sr-only"
              />
              <Label
                htmlFor="theme-dark"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Moon className="mb-3 h-6 w-6" />
                <span className="text-sm font-medium">Koyu</span>
              </Label>
            </div>

            <div>
              <RadioGroupItem
                value="LIGHT"
                id="theme-light"
                className="peer sr-only"
              />
              <Label
                htmlFor="theme-light"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <div className="mb-3 h-6 w-6 rounded-full border-2 border-current" />
                <span className="text-sm font-medium">Açık</span>
              </Label>
            </div>

            <div>
              <RadioGroupItem
                value="SYSTEM"
                id="theme-system"
                className="peer sr-only"
              />
              <Label
                htmlFor="theme-system"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <div className="mb-3 h-6 w-6 flex">
                  <div className="w-1/2 h-full bg-current rounded-l-full" />
                  <div className="w-1/2 h-full bg-muted rounded-r-full" />
                </div>
                <span className="text-sm font-medium">Sistem</span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Tehlikeli Bölge</CardTitle>
          </div>
          <CardDescription>
            Bu işlemler geri alınamaz. Lütfen dikkatli olun.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger render={
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Hesabı Sil
              </Button>
            } />
            <DialogContent>
              <DialogHeader>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <DialogTitle>Hesabı Sil</DialogTitle>
                  </div>
                  <DialogDescription>
                    Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecektir.
                  </DialogDescription>
                </DialogHeader>
              </DialogHeader>

              <div className="py-4">
                <div className="rounded-lg bg-destructive/10 p-4 text-sm">
                  <p className="font-medium text-destructive">Silinecek veriler:</p>
                  <ul className="mt-2 list-disc list-inside text-destructive/80 space-y-1">
                    <li>Profil bilgileriniz</li>
                    <li>Sınav geçmişiniz</li>
                    <li>Puanlarınız ve başarılarınız</li>
                    <li>Cüzdan bakiyeniz</li>
                  </ul>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={isDeleting}
                >
                  İptal
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Siliniyor...
                    </>
                  ) : (
                    "Hesabı Kalıcı Olarak Sil"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
