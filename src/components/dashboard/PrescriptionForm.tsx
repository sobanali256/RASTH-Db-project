
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
import { Save, Plus, Trash, X } from "lucide-react";
import { toast } from "sonner";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface PrescriptionFormProps {
  patientId: string;
  patientName: string;
  onSave: (prescription: any) => void;
  onCancel: () => void;
}

export function PrescriptionForm({ patientId, patientName, onSave, onCancel }: PrescriptionFormProps) {
  const [medications, setMedications] = useState<Medication[]>([{
    id: `med-${Math.random().toString(36).substring(2, 9)}`,
    name: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: ""
  }]);
  
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  
  const addMedication = () => {
    setMedications([
      ...medications,
      {
        id: `med-${Math.random().toString(36).substring(2, 9)}`,
        name: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: ""
      }
    ]);
  };
  
  const removeMedication = (id: string) => {
    if (medications.length === 1) {
      return;
    }
    setMedications(medications.filter(med => med.id !== id));
  };
  
  const updateMedication = (id: string, field: keyof Medication, value: string) => {
    setMedications(medications.map(med => 
      med.id === id ? { ...med, [field]: value } : med
    ));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that at least one medication is properly filled
    const isValid = medications.some(med => 
      med.name.trim() !== "" && med.dosage.trim() !== "" && med.frequency.trim() !== ""
    );
    
    if (!isValid) {
      toast.error("Please enter at least one medication with name, dosage, and frequency");
      return;
    }
    
    const newPrescription = {
      id: `prescription-${Math.random().toString(36).substring(2, 9)}`,
      patientId,
      patientName,
      medications,
      diagnosis,
      notes,
      status: "active",
      createdAt: new Date(),
      refills: 0,
    };
    
    onSave(newPrescription);
    toast.success("Prescription saved successfully");
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Prescribe Medication for {patientName}</h2>
        <Button 
          type="button" 
          variant="ghost" 
          size="icon"
          onClick={onCancel}
        >
          <X />
        </Button>
      </div>
      
      <div>
        <Label htmlFor="diagnosis">Diagnosis</Label>
        <Input
          id="diagnosis"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="Primary diagnosis"
          required
        />
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-2">
          <Label>Medications</Label>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={addMedication}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Medication
          </Button>
        </div>
        
        <div className="space-y-4">
          {medications.map((medication, index) => (
            <div key={medication.id} className="p-4 border rounded-md bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Medication {index + 1}</h3>
                {medications.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMedication(medication.id)}
                    className="h-7 w-7 text-red-500 hover:text-red-700"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`med-name-${index}`}>Medication Name</Label>
                  <Input
                    id={`med-name-${index}`}
                    value={medication.name}
                    onChange={(e) => updateMedication(medication.id, "name", e.target.value)}
                    placeholder="Medication name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor={`med-dosage-${index}`}>Dosage</Label>
                  <Input
                    id={`med-dosage-${index}`}
                    value={medication.dosage}
                    onChange={(e) => updateMedication(medication.id, "dosage", e.target.value)}
                    placeholder="e.g., 10mg, 500mg"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor={`med-frequency-${index}`}>Frequency</Label>
                  <Select 
                    value={medication.frequency} 
                    onValueChange={(value) => updateMedication(medication.id, "frequency", value)}
                  >
                    <SelectTrigger id={`med-frequency-${index}`}>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once-daily">Once daily</SelectItem>
                      <SelectItem value="twice-daily">Twice daily</SelectItem>
                      <SelectItem value="three-times-daily">Three times daily</SelectItem>
                      <SelectItem value="four-times-daily">Four times daily</SelectItem>
                      <SelectItem value="as-needed">As needed (PRN)</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor={`med-duration-${index}`}>Duration</Label>
                  <Input
                    id={`med-duration-${index}`}
                    value={medication.duration}
                    onChange={(e) => updateMedication(medication.id, "duration", e.target.value)}
                    placeholder="e.g., 7 days, 2 weeks"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor={`med-instructions-${index}`}>Instructions</Label>
                  <Textarea
                    id={`med-instructions-${index}`}
                    value={medication.instructions}
                    onChange={(e) => updateMedication(medication.id, "instructions", e.target.value)}
                    placeholder="Special instructions (e.g., take with food)"
                    className="h-20"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional instructions or notes"
          className="h-20"
        />
      </div>
      
      <div className="flex justify-end space-x-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Save className="mr-2 h-4 w-4" />
          Save Prescription
        </Button>
      </div>
    </form>
  );
}
