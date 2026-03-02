import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut } from "lucide-react";

export function ProfileAvatar() {
  const navigate = useNavigate();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(
    () => localStorage.getItem("profilePhoto")
  );

  useEffect(() => {
    const handleStorage = () => setProfilePhoto(localStorage.getItem("profilePhoto"));
    window.addEventListener("storage", handleStorage);
    const interval = setInterval(handleStorage, 1000);
    return () => { window.removeEventListener("storage", handleStorage); clearInterval(interval); };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar className="h-8 w-8 border-2 border-primary/20 hover:border-primary/50 transition-colors cursor-pointer">
            {profilePhoto && <AvatarImage src={profilePhoto} alt="Profile" className="object-cover" />}
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              AU
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-48">
        <DropdownMenuItem onClick={() => navigate("/profile")} className="gap-2 cursor-pointer">
          <User className="h-4 w-4" /> My Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" /> Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
