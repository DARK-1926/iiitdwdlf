
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from "@/components/Layout";
import { toast } from 'sonner';
import { ItemCategory, ItemStatus } from '@/types';
import { supabase } from "@/integrations/supabase/client";
import { fadeInUp } from '@/lib/animations';
import ReportTypeSelector from '@/components/report/ReportTypeSelector';
import ReportForm from '@/components/report/ReportForm';
import SimilarItemsDialog from '@/components/report/SimilarItemsDialog';

const ReportItemPage = () => {
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);
  const [itemType, setItemType] = useState<ItemStatus>('found');
  const [uploading, setUploading] = useState(false);
  const [similarItems, setSimilarItems] = useState<any[]>([]);
  const [showSimilarItems, setShowSimilarItems] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as ItemCategory,
    location: '',
    date: '',
    image: null as File | null,
  });

  useEffect(() => {
    if (formRef.current) {
      fadeInUp(formRef.current);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, image: e.target.files[0] });
    }
  };

  const checkForSimilarItems = async () => {
    try {
      // Check for items with similar titles or descriptions
      const { data } = await supabase
        .from('items')
        .select('id, title, description, category, status, location, date, images')
        .eq('status', itemType === 'lost' ? 'found' : 'lost') // Look for the opposite type
        .or(`title.ilike.%${formData.title}%,description.ilike.%${formData.description}%`)
        .eq('category', formData.category);
      
      if (data && data.length > 0) {
        setSimilarItems(data);
        setShowSimilarItems(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking for similar items:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      // First check for similar items
      const hasSimilarItems = await checkForSimilarItems();
      
      if (hasSimilarItems) {
        setUploading(false);
        return; // Stop submission and show similar items dialog
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || '00000000-0000-0000-0000-000000000000';
      
      let imageUrl = null;
      if (formData.image) {
        const fileExt = formData.image.name.split('.').pop();
        const fileName = `${userId}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('item_images')
          .upload(filePath, formData.image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('item_images')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      const { error } = await supabase
        .from('items')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            category: formData.category,
            status: itemType,
            location: formData.location,
            date: new Date(formData.date).toISOString(),
            images: imageUrl ? [imageUrl] : [],
            reported_by: userId
          }
        ]);

      if (error) throw error;

      toast.success(`${itemType === 'lost' ? 'Lost' : 'Found'} item reported successfully!`, {
        description: "Thank you for your report. It's now visible to the community.",
      });

      navigate(`/items/${itemType}`);
    } catch (error) {
      console.error('Error reporting item:', error);
      toast.error('Failed to report item', {
        description: 'Please try again later.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleContinueWithSubmission = () => {
    setShowSimilarItems(false);
    
    // Continue with form submission
    const submitForm = async () => {
      setUploading(true);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || '00000000-0000-0000-0000-000000000000';
        
        let imageUrl = null;
        if (formData.image) {
          const fileExt = formData.image.name.split('.').pop();
          const fileName = `${userId}_${Date.now()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError, data: uploadData } = await supabase.storage
            .from('item_images')
            .upload(filePath, formData.image);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('item_images')
            .getPublicUrl(filePath);

          imageUrl = publicUrl;
        }

        const { error } = await supabase
          .from('items')
          .insert([
            {
              title: formData.title,
              description: formData.description,
              category: formData.category,
              status: itemType,
              location: formData.location,
              date: new Date(formData.date).toISOString(),
              images: imageUrl ? [imageUrl] : [],
              reported_by: userId
            }
          ]);

        if (error) throw error;

        toast.success(`${itemType === 'lost' ? 'Lost' : 'Found'} item reported successfully!`, {
          description: "Thank you for your report. It's now visible to the community.",
        });

        navigate(`/items/${itemType}`);
      } catch (error) {
        console.error('Error reporting item:', error);
        toast.error('Failed to report item', {
          description: 'Please try again later.',
        });
      } finally {
        setUploading(false);
      }
    };
    
    submitForm();
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Report an Item</h1>
        
        <div ref={formRef} className="bg-card rounded-lg shadow p-6 mb-6">
          <ReportTypeSelector
            itemType={itemType}
            onTypeChange={setItemType}
            disabled={uploading}
          />
          
          <ReportForm
            formData={formData}
            onInputChange={handleInputChange}
            onSelectChange={handleSelectChange}
            onImageChange={handleImageChange}
            onSubmit={handleSubmit}
            itemType={itemType}
            uploading={uploading}
          />
        </div>
      </div>
      
      <SimilarItemsDialog
        open={showSimilarItems}
        onOpenChange={setShowSimilarItems}
        items={similarItems}
        onContactItem={(itemId) => navigate(`/item/${itemId}`)}
        onContinue={handleContinueWithSubmission}
      />
    </Layout>
  );
};

export default ReportItemPage;
