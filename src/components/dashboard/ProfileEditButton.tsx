import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditProfileForm } from "./EditProfileForm";
import { Pencil } from "lucide-react";

interface ProfileEditButtonProps {
  userType: "doctor" | "patient";
}

export function ProfileEditButton({ userType }: ProfileEditButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSuccess = () => {
    setIsDialogOpen(false);
    // Optionally refresh the page or parent component data
    window.location.reload();
  };

  return (
    <>
      <Button 
        onClick={() => setIsDialogOpen(true)} 
        variant="outline" 
        size="sm"
        className="flex items-center gap-1"
      >
        <Pencil className="h-4 w-4" />
        Edit Profile
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Your Profile</DialogTitle>
          </DialogHeader>
          <EditProfileForm userType={userType} onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>
    </>
  );
}