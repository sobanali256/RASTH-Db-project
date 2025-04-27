
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, X } from "lucide-react";
import { toast } from "sonner";

interface PatientNoteProps {
  patientId: string;
  patientName: string;
  onSave: (note: any) => void;
  onCancel: () => void;
}

export function PatientNote({ patientId, patientName, onSave, onCancel }: PatientNoteProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [content, setContent] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newNote = {
      id: `note-${Math.random().toString(36).substring(2, 9)}`,
      patientId,
      patientName,
      title,
      category,
      content,
      isPrivate,
      createdAt: new Date(),
    };
    
    onSave(newNote);
    toast.success("Note saved successfully");
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Add Note for {patientName}</h2>
        <Button 
          type="button" 
          variant="ghost" 
          size="icon"
          onClick={onCancel}
        >
          <X />
        </Button>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief summary of the note"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="category">Category</Label>
          <Select 
            value={category} 
            onValueChange={setCategory}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="diagnosis">Diagnosis</SelectItem>
              <SelectItem value="treatment">Treatment</SelectItem>
              <SelectItem value="medication">Medication</SelectItem>
              <SelectItem value="lab">Lab Results</SelectItem>
              <SelectItem value="imaging">Imaging</SelectItem>
              <SelectItem value="followup">Follow-up</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="content">Note Content</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter detailed notes here"
            className="min-h-[150px]"
            required
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isPrivate"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="rounded border-gray-300"
          />
          <Label htmlFor="isPrivate" className="text-sm font-normal cursor-pointer">
            Keep private (not visible to patient)
          </Label>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Save className="mr-2 h-4 w-4" />
          Save Note
        </Button>
      </div>
    </form>
  );
}
