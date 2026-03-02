import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, MapPin, Briefcase, Shield, Camera, Save, KeyRound } from "lucide-react";

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
  const [isEditing, setIsEditing] = useState(false);
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

  const handlePasswordChange = () => {
    toast({ title: "Password reset", description: "Password change feature coming soon." });
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
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors">
                <Camera className="h-4 w-4" />
              </button>
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
                  <p className="text-xs text-muted-foreground">Last changed 30 days ago</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handlePasswordChange} className="gap-2">
                <KeyRound className="h-3.5 w-3.5" /> Change Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
