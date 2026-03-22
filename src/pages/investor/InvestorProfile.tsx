import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/KpiCard";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  User, Mail, Phone, MapPin, Camera, Save, KeyRound, Eye, EyeOff,
  Wallet, TrendingUp, BarChart3, DollarSign, Heart, Shield,
} from "lucide-react";

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  address: string;
  nidNumber: string;
  bloodGroup: string;
  jerseySize: string;
  joinDate: string;
  nomineeName: string;
  nomineeRelationship: string;
  nomineePhone: string;
  nomineeNid: string;
}

const InvestorProfile = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const [profilePhoto, setProfilePhoto] = useState<string | null>(() => localStorage.getItem("profilePhoto"));

  const [profile, setProfile] = useState<ProfileData>({
    name: "Investor User",
    email: "investor@investfarm.com",
    phone: "+880 1712-345678",
    address: "Dhaka, Bangladesh",
    nidNumber: "1234567890",
    bloodGroup: "O+",
    jerseySize: "L",
    joinDate: "2024-01-15",
    nomineeName: "Jane Doe",
    nomineeRelationship: "Spouse",
    nomineePhone: "+880 1798-765432",
    nomineeNid: "9876543210",
  });

  const [editProfile, setEditProfile] = useState<ProfileData>(profile);

  // Mock investment summary
  const investmentSummary = {
    walletBalance: 45000,
    ltiShares: 5,
    ltiInvested: 50000,
    ltiProfit: 3200,
    stiInvested: 25000,
    stiProfit: 1800,
    totalInvested: 75000,
    totalProfit: 5000,
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB allowed", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setProfilePhoto(base64);
      localStorage.setItem("profilePhoto", base64);
      toast({ title: "Photo updated" });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setProfile(editProfile);
    setIsEditing(false);
    toast({ title: "Profile updated successfully" });
  };

  const handleCancel = () => {
    setEditProfile(profile);
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    const errors: Record<string, string> = {};
    if (!passwordForm.currentPassword) errors.currentPassword = "Required";
    if (passwordForm.newPassword.length < 6) errors.newPassword = "Min 6 characters";
    if (passwordForm.newPassword !== passwordForm.confirmPassword) errors.confirmPassword = "Passwords don't match";
    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setChangePasswordOpen(false);
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setPasswordErrors({});
    toast({ title: "Password changed successfully" });
  };

  const fmt = (n: number) => "৳" + n.toLocaleString();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your account and view investment summary</p>
        </div>
        {!isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setChangePasswordOpen(true)}>
              <KeyRound className="h-4 w-4 mr-1" /> Change Password
            </Button>
            <Button size="sm" onClick={() => { setEditProfile(profile); setIsEditing(true); }}>
              Edit Profile
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
            <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 mr-1" /> Save</Button>
          </div>
        )}
      </div>

      {/* Investment Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Wallet Balance" value={fmt(investmentSummary.walletBalance)} icon={<Wallet className="h-5 w-5" />} accentColor="text-blue-500" />
        <KpiCard title="Total Invested" value={fmt(investmentSummary.totalInvested)} icon={<DollarSign className="h-5 w-5" />} accentColor="text-primary" />
        <KpiCard title="LTI Shares" value={String(investmentSummary.ltiShares)} icon={<TrendingUp className="h-5 w-5" />} accentColor="text-emerald-500" />
        <KpiCard title="Total Profit" value={fmt(investmentSummary.totalProfit)} icon={<BarChart3 className="h-5 w-5" />} accentColor="text-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <div className="relative group mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profilePhoto || undefined} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {profile.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>
            <h3 className="text-lg font-semibold text-foreground">{profile.name}</h3>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <Badge variant="secondary" className="mt-2">Investor</Badge>
            <Separator className="my-4 w-full" />
            <div className="w-full space-y-2 text-left text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" /> {profile.phone}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {profile.address}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-3.5 w-3.5" /> NID: {profile.nidNumber}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Full Name", key: "name" as const, icon: User },
                { label: "Email", key: "email" as const, icon: Mail },
                { label: "Phone", key: "phone" as const, icon: Phone },
                { label: "Address", key: "address" as const, icon: MapPin },
                { label: "NID Number", key: "nidNumber" as const },
                { label: "Blood Group", key: "bloodGroup" as const },
                { label: "Jersey Size", key: "jerseySize" as const },
              ].map(({ label, key }) => (
                <div key={key}>
                  <Label className="text-xs text-muted-foreground">{label}</Label>
                  {isEditing ? (
                    <Input
                      value={editProfile[key]}
                      onChange={(e) => setEditProfile({ ...editProfile, [key]: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm font-medium text-foreground mt-1">{profile[key]}</p>
                  )}
                </div>
              ))}
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Heart className="h-4 w-4 text-destructive" /> Nominee Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Nominee Name", key: "nomineeName" as const },
                  { label: "Relationship", key: "nomineeRelationship" as const },
                  { label: "Nominee Phone", key: "nomineePhone" as const },
                  { label: "Nominee NID", key: "nomineeNid" as const },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <Label className="text-xs text-muted-foreground">{label}</Label>
                    {isEditing ? (
                      <Input
                        value={editProfile[key]}
                        onChange={(e) => setEditProfile({ ...editProfile, [key]: e.target.value })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium text-foreground mt-1">{profile[key]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Investment Breakdown */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Investment Summary</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-muted/30">
                  <CardContent className="pt-4 pb-4 space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Long-Term Investment</p>
                    <p className="text-sm text-foreground">Shares: <span className="font-semibold">{investmentSummary.ltiShares}</span></p>
                    <p className="text-sm text-foreground">Invested: <span className="font-semibold">{fmt(investmentSummary.ltiInvested)}</span></p>
                    <p className="text-sm text-emerald-600">Profit: {fmt(investmentSummary.ltiProfit)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/30">
                  <CardContent className="pt-4 pb-4 space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Short-Term Investment</p>
                    <p className="text-sm text-foreground">Invested: <span className="font-semibold">{fmt(investmentSummary.stiInvested)}</span></p>
                    <p className="text-sm text-emerald-600">Profit: {fmt(investmentSummary.stiProfit)}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {[
              { label: "Current Password", key: "currentPassword", show: showCurrentPassword, toggle: setShowCurrentPassword },
              { label: "New Password", key: "newPassword", show: showNewPassword, toggle: setShowNewPassword },
              { label: "Confirm Password", key: "confirmPassword", show: showConfirmPassword, toggle: setShowConfirmPassword },
            ].map(({ label, key, show, toggle }) => (
              <div key={key}>
                <Label>{label}</Label>
                <div className="relative">
                  <Input
                    type={show ? "text" : "password"}
                    value={passwordForm[key as keyof typeof passwordForm]}
                    onChange={(e) => setPasswordForm({ ...passwordForm, [key]: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggle(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordErrors[key] && <p className="text-xs text-destructive mt-1">{passwordErrors[key]}</p>}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePasswordOpen(false)}>Cancel</Button>
            <Button onClick={handleChangePassword}>Update Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvestorProfile;
