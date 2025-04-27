
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ItemCategory, itemCategories, ItemStatus } from "@/types";
import { CalendarIcon, Loader2, Upload } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import MapLocationPicker from '@/components/MapLocationPicker';

interface ReportFormData {
  title: string;
  description: string;
  category: ItemCategory | '';
  location: string;
  date: string;
  image: File | null;
  coordinates?: { latitude: number; longitude: number } | null;
}

interface ReportFormProps {
  formData: ReportFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLocationSelect?: (coordinates: { latitude: number; longitude: number }) => void;
  onSubmit: (e: React.FormEvent) => void;
  itemType: ItemStatus;
  uploading: boolean;
}

const ReportForm = ({
  formData,
  onInputChange,
  onSelectChange,
  onImageChange,
  onLocationSelect,
  onSubmit,
  itemType,
  uploading
}: ReportFormProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxDate = new Date();
  
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onSelectChange('date', date.toISOString());
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            placeholder="Brief title describing the item"
            value={formData.title}
            onChange={onInputChange}
            required
            disabled={uploading}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            name="category"
            value={formData.category}
            onValueChange={(value) => onSelectChange('category', value)}
            required
            disabled={uploading}
          >
            <SelectTrigger id="category" className="mt-1">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {itemCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder={`Describe the ${itemType} item with as much detail as possible`}
            value={formData.description}
            onChange={onInputChange}
            rows={5}
            required
            disabled={uploading}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            placeholder="Where was the item lost/found?"
            value={formData.location}
            onChange={onInputChange}
            required
            disabled={uploading}
            className="mt-1"
          />
        </div>

        {/* Map Location Picker */}
        {onLocationSelect && (
          <div>
            <Label>Pin Location on Map</Label>
            <div className="mt-1">
              <MapLocationPicker 
                onLocationSelect={onLocationSelect}
                defaultLocation={formData.coordinates || undefined}
              />
            </div>
          </div>
        )}
        
        <div>
          <Label htmlFor="date">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className={cn(
                  "w-full mt-1 justify-start text-left font-normal",
                  !formData.date && "text-muted-foreground"
                )}
                disabled={uploading}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.date ? format(new Date(formData.date), 'PPP') : `Select ${itemType === 'lost' ? 'when' : 'when you found it'}`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.date ? new Date(formData.date) : undefined}
                onSelect={handleDateSelect}
                disabled={(date) => date > maxDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div>
          <Label htmlFor="image">Upload Image</Label>
          <div className="mt-1 flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
              disabled={uploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {formData.image ? 'Replace Image' : 'Choose Image'}
            </Button>
            <input
              type="file"
              id="image"
              name="image"
              ref={fileInputRef}
              onChange={onImageChange}
              accept="image/*"
              className="hidden"
              disabled={uploading}
            />
            {formData.image && (
              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                {formData.image.name}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={uploading}>
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          `Submit ${itemType === 'lost' ? 'Lost' : 'Found'} Report`
        )}
      </Button>
    </form>
  );
};

export default ReportForm;
