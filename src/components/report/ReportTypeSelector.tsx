
import { ItemStatus } from "@/types";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ReportTypeSelectorProps {
  itemType: ItemStatus;
  onTypeChange: (value: ItemStatus) => void;
  disabled?: boolean;
}

const ReportTypeSelector = ({ itemType, onTypeChange, disabled }: ReportTypeSelectorProps) => {
  return (
    <div className="mb-6">
      <Label>What are you reporting?</Label>
      <RadioGroup
        value={itemType}
        onValueChange={(value) => onTypeChange(value as ItemStatus)}
        className="flex space-x-4 mt-2"
        disabled={disabled}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="found" id="found" />
          <Label htmlFor="found" className="cursor-pointer">I found something</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="lost" id="lost" />
          <Label htmlFor="lost" className="cursor-pointer">I lost something</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default ReportTypeSelector;
