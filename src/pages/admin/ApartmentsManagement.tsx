import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface Apartment {
  id: string;
  name: string;
  type: string;
  location: string;
  price: number;
  rooms: number;
  bathrooms: number;
  square_feet: number;
  description: string;
  display_image?: string;
  gallery_images?: string[];
  featured: boolean;
}

const ApartmentsManagement = () => {
  const { toast } = useToast();
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchApartments();
  }, []);

  const fetchApartments = async () => {
    try {
      const { data, error } = await supabase
        .from('apartments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApartments(data || []);
    } catch (error) {
      console.error('Error fetching apartments:', error);
      toast({
        title: "Error",
        description: "Could not load apartments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const galleryImages = formData.get('gallery_images') as string;
    
    const apartmentData = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      location: formData.get('location') as string,
      price: parseFloat(formData.get('price') as string),
      rooms: parseInt(formData.get('rooms') as string),
      bathrooms: parseInt(formData.get('bathrooms') as string),
      square_feet: parseInt(formData.get('square_feet') as string),
      description: formData.get('description') as string,
      display_image: formData.get('display_image') as string || null,
      gallery_images: galleryImages ? galleryImages.split(',').map(s => s.trim()) : null,
      featured: formData.get('featured') === 'on',
    };

    try {
      if (editingApartment) {
        const { error } = await supabase
          .from('apartments')
          .update(apartmentData)
          .eq('id', editingApartment.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Apartment updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('apartments')
          .insert(apartmentData);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Apartment created successfully",
        });
      }

      setShowDialog(false);
      setEditingApartment(null);
      fetchApartments();
    } catch (error: any) {
      console.error('Error saving apartment:', error);
      toast({
        title: "Error",
        description: error.message || "Could not save apartment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this apartment?')) return;

    try {
      const { error } = await supabase
        .from('apartments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Apartment deleted successfully",
      });
      
      fetchApartments();
    } catch (error: any) {
      console.error('Error deleting apartment:', error);
      toast({
        title: "Error",
        description: error.message || "Could not delete apartment",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (apartment: Apartment) => {
    setEditingApartment(apartment);
    setShowDialog(true);
  };

  const openCreateDialog = () => {
    setEditingApartment(null);
    setShowDialog(true);
  };

  if (loading) {
    return <div className="text-center py-8">Loading apartments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Apartments Management</h2>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Apartment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingApartment ? 'Edit Apartment' : 'Add New Apartment'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Apartment Name *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingApartment?.name}
                  required
                  placeholder="e.g., Ocean View Apartment"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select name="type" defaultValue={editingApartment?.type || 'Rent'} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Rent">Rent</SelectItem>
                      <SelectItem value="Airbnb">Airbnb</SelectItem>
                      <SelectItem value="Buy">Buy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price (KSh) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    defaultValue={editingApartment?.price}
                    required
                    placeholder="e.g., 50000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={editingApartment?.location}
                  required
                  placeholder="e.g., Nyali, Mombasa"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rooms">Bedrooms *</Label>
                  <Input
                    id="rooms"
                    name="rooms"
                    type="number"
                    defaultValue={editingApartment?.rooms}
                    required
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms *</Label>
                  <Input
                    id="bathrooms"
                    name="bathrooms"
                    type="number"
                    defaultValue={editingApartment?.bathrooms}
                    required
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="square_feet">Square Feet *</Label>
                  <Input
                    id="square_feet"
                    name="square_feet"
                    type="number"
                    defaultValue={editingApartment?.square_feet}
                    required
                    min="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingApartment?.description}
                  required
                  rows={4}
                  placeholder="Describe the apartment..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_image">Display Image URL</Label>
                <Input
                  id="display_image"
                  name="display_image"
                  type="url"
                  defaultValue={editingApartment?.display_image}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gallery_images">Gallery Images (comma-separated URLs)</Label>
                <Textarea
                  id="gallery_images"
                  name="gallery_images"
                  defaultValue={editingApartment?.gallery_images?.join(', ')}
                  rows={2}
                  placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="featured"
                  name="featured"
                  defaultChecked={editingApartment?.featured}
                />
                <Label htmlFor="featured" className="cursor-pointer">
                  Featured Property
                </Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? 'Saving...' : editingApartment ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {apartments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <p className="text-muted-foreground mb-4">No apartments yet</p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Apartment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {apartments.map((apartment) => (
            <Card key={apartment.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{apartment.name}</h3>
                      {apartment.featured && (
                        <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-2">{apartment.location}</p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{apartment.type}</span>
                      <span>•</span>
                      <span>KSh {apartment.price.toLocaleString()}</span>
                      <span>•</span>
                      <span>{apartment.rooms} beds</span>
                      <span>•</span>
                      <span>{apartment.bathrooms} baths</span>
                      <span>•</span>
                      <span>{apartment.square_feet} sqft</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/apartments/${apartment.id}`} target="_blank">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(apartment)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(apartment.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApartmentsManagement;
