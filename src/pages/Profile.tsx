import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, MapPin, Briefcase, Shield, Camera, Save, KeyRound, Eye, EyeOff } from "lucide-react";

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  address: string;
  role: string;
  joinDate: string;
}

const Profile = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const [profilePhoto, setProfilePhoto] = useState<string | null>(() => {
    return localStorage.getItem("profilePhoto");
  });

  const [profile, setProfile] = useState<ProfileData>({
    name: "Admin User",
    email: "admin@investfarm.com",
    phone: "+8801712345678",
    designation: "System Administrator",
    department: "Operations",
    address: "Dhaka, Bangladesh",
    role: "Super Admin",
    joinDate: "2024-01-15",
  });

  const [editForm, setEditForm] = useState<ProfileData>(profile);

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSave = () => {
    setProfile(editForm);
    setIsEditing(false);
    toast({ title: "Profile updated", description: "Your profile has been saved successfully." });
  };

  const handleCancel = () => {
    setEditForm(profile);
    setIsEditing(false);
  };

  // --- Profile Photo Upload ---
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file (JPG, PNG, etc.).", variant: "destructive" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image smaller than 5MB.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setProfilePhoto(dataUrl);
      localStorage.setItem("profilePhoto", dataUrl);
      toast({ title: "Photo updated", description: "Your profile photo has been changed." });
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  // --- Change Password ---
  const validatePassword = (): boolean => {
    const errors: Record<string, string> = {};
    const storedPassword = localStorage.getItem("userPassword") || "password123";

    if (!passwordForm.currentPassword) {
      errors.currentPassword = "Current password is required";
    } else if (passwordForm.currentPassword !== storedPassword) {
      errors.currentPassword = "Current password is incorrect";
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    } else if (passwordForm.newPassword.length > 50) {
      errors.newPassword = "Password must be less than 50 characters";
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = () => {
    if (!validatePassword()) return;

    localStorage.setItem("userPassword", passwordForm.newPassword);
    setChangePasswordOpen(false);
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setPasswordErrors({});
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    toast({ title: "Password changed", description: "Your password has been updated successfully." });
  };

  const handlePasswordDialogClose = (open: boolean) => {
    if (!open) {
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordErrors({});
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
    setChangePasswordOpen(open);
  };

  const infoField = (icon: React.ReactNode, label: string, value: string, field?: keyof ProfileData) => (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 p-2 rounded-lg bg-primary/10 text-primary shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        {isEditing && field ? (
          <Input
            value={editForm[field]}
            onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
            className="mt-1 h-9"
          />
        ) : (
          <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account details and preferences</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
            <User className="h-4 w-4" /> Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" /> Save Changes
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1 border-border">
          <CardContent className="pt-8 pb-6 flex flex-col items-center text-center">
            <div className="relative group">
              <Avatar className="h-28 w-28 border-4 border-primary/20">
                {profilePhoto ? (
                  <AvatarImage src={profilePhoto} alt={profile.name} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handlePhotoClick}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
                title="Upload photo"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
            <h2 className="text-xl font-bold text-foreground mt-4">{profile.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{profile.designation}</p>
            <Badge variant="secondary" className="mt-3 gap-1.5">
              <Shield className="h-3 w-3" />
              {profile.role}
            </Badge>
            <Separator className="my-5" />
            <div className="w-full space-y-3 text-left">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground truncate">{profile.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{profile.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{profile.address}</span>
              </div>
            </div>
            <Separator className="my-5" />
            <p className="text-xs text-muted-foreground">
              Member since {new Date(profile.joinDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {infoField(<User className="h-4 w-4" />, "Full Name", profile.name, "name")}
            <Separator />
            {infoField(<Mail className="h-4 w-4" />, "Email Address", profile.email, "email")}
            <Separator />
            {infoField(<Phone className="h-4 w-4" />, "Phone Number", profile.phone, "phone")}
            <Separator />
            {infoField(<Briefcase className="h-4 w-4" />, "Designation", profile.designation, "designation")}
            <Separator />
            {infoField(<Briefcase className="h-4 w-4" />, "Department", profile.department, "department")}
            <Separator />
            {infoField(<MapPin className="h-4 w-4" />, "Address", profile.address, "address")}
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card className="lg:col-span-3 border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Security</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Password</p>
                  <p className="text-xs text-muted-foreground">Change your account password</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setChangePasswordOpen(true)} className="gap-2">
                <KeyRound className="h-3.5 w-3.5" /> Change Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={handlePasswordDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Change Password
            </DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Enter current password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => {
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value });
                    if (passwordErrors.currentPassword) setPasswordErrors({ ...passwordErrors, currentPassword: "" });
                  }}
                  className={passwordErrors.currentPassword ? "border-destructive pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="text-xs text-destructive">{passwordErrors.currentPassword}</p>
              )}
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={passwordForm.newPassword}
                  onChange={(e) => {
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                    if (passwordErrors.newPassword) setPasswordErrors({ ...passwordErrors, newPassword: "" });
                  }}
                  className={passwordErrors.newPassword ? "border-destructive pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.newPassword && (
                <p className="text-xs text-destructive">{passwordErrors.newPassword}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => {
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value });
                    if (passwordErrors.confirmPassword) setPasswordErrors({ ...passwordErrors, confirmPassword: "" });
                  }}
                  className={passwordErrors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.confirmPassword && (
                <p className="text-xs text-destructive">{passwordErrors.confirmPassword}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handlePasswordDialogClose(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordChange} className="gap-2">
              <KeyRound className="h-4 w-4" /> Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;