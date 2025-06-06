
'use client';

import { useState, useEffect } from 'react';
import type { Sticker } from '@/types';
import { MOCK_STICKERS } from '@/data/sticker-data'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Edit3, Trash2, Search, PackageOpen, Image as ImageIcon } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import NextImage from 'next/image'; // Renamed to avoid conflict
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AdminLayout from "../layout"; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProductForm } from '@/components/admin/product-form';
import { useToast } from '@/hooks/use-toast';


export default function AdminInventoryPage() {
  const [stickers, setStickers] = useState<Sticker[]>(MOCK_STICKERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSticker, setEditingSticker] = useState<Sticker | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const filteredStickers = stickers.filter(sticker =>
    sticker.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenForm = (sticker: Sticker | null = null) => {
    setEditingSticker(sticker);
    setIsFormOpen(true);
  };

  const handleSaveProduct = async (
    formData: Omit<Sticker, 'imageUrls' | 'videoUrls' | 'id'> & { id?: string; imageUrls?: string[], videoUrls?: string[] }, 
    imageFiles: File[], 
    videoFiles: File[]
  ) => {
    setIsSubmitting(true);
    console.log('Saving product:', formData);
    console.log('Image files:', imageFiles);
    console.log('Video files:', videoFiles);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In a real app, you would:
    // 1. Upload imageFiles and videoFiles to storage (e.g., Firebase Storage)
    // 2. Get the URLs of the uploaded files.
    // 3. Combine these new URLs with any existing formData.imageUrls/videoUrls (handle removal of old ones if needed)
    // 4. Save the complete sticker data (formData + final URLs) to your database.

    const newImageUrls = [...(formData.imageUrls || [])]; // Keep existing
    // For demo, we're not actually uploading, so we'll just use placeholders if new files exist
    if (imageFiles.length > 0) {
        newImageUrls.push(...imageFiles.map(f => `https://placehold.co/100x100.png?text=New+Img`));
    }

    const newVideoUrls = [...(formData.videoUrls || [])];
    if (videoFiles.length > 0) {
        newVideoUrls.push(...videoFiles.map(f => `https://placehold.co/160x90.png?text=New+Vid`));
    }


    if (editingSticker && formData.id) {
      // Update existing sticker
      setStickers(prev => prev.map(s => s.id === formData.id ? { ...s, ...formData, imageUrls: newImageUrls, videoUrls: newVideoUrls } as Sticker : s));
      toast({ title: "Product Updated", description: `${formData.name} has been updated.` });
    } else {
      // Add new sticker
      const newSticker: Sticker = {
        id: `sticker-${Date.now()}`,
        ...formData,
        imageUrls: newImageUrls,
        videoUrls: newVideoUrls,
      };
      setStickers(prev => [newSticker, ...prev]);
      toast({ title: "Product Added", description: `${newSticker.name} has been added.` });
    }
    setIsSubmitting(false);
    setIsFormOpen(false);
    setEditingSticker(null);
  };
  
  const handleDeleteProduct = (stickerId: string) => {
    // TODO: Add confirmation dialog here
    setStickers(prev => prev.filter(s => s.id !== stickerId));
    toast({ title: "Product Deleted", description: `Product has been removed.`, variant: "destructive" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-headline text-primary">Inventory Management</h1>
          <Button onClick={() => handleOpenForm(null)}>
            <PlusCircle className="mr-2 h-5 w-5" /> Add Product
          </Button>
        </div>

        <Dialog open={isFormOpen} onOpenChange={(open) => {
            if (!open) {
                setEditingSticker(null); // Reset editing state when dialog closes
            }
            setIsFormOpen(open);
        }}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">{editingSticker ? 'Edit Sticker' : 'Add New Sticker'}</DialogTitle>
                    <DialogDescription className="font-body">
                        {editingSticker ? `Update details for ${editingSticker.name}.` : 'Fill in the details for the new sticker.'}
                    </DialogDescription>
                </DialogHeader>
                <ProductForm 
                    sticker={editingSticker}
                    onSave={handleSaveProduct}
                    onCancel={() => {
                        setIsFormOpen(false);
                        setEditingSticker(null);
                    }}
                    isSubmitting={isSubmitting}
                />
            </DialogContent>
        </Dialog>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search stickers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full md:w-1/3"
          />
        </div>

        {filteredStickers.length > 0 ? (
        <Card className="shadow-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStickers.map((sticker) => (
                <TableRow key={sticker.id} className="hover:bg-muted/50">
                  <TableCell>
                    {sticker.imageUrls && sticker.imageUrls.length > 0 ? (
                        <NextImage
                        src={sticker.imageUrls[0]}
                        alt={sticker.name}
                        width={50}
                        height={50}
                        className="rounded-md object-cover border"
                        data-ai-hint="sticker product"
                        />
                    ) : (
                        <div className="h-[50px] w-[50px] bg-muted rounded-md flex items-center justify-center border">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium font-body">{sticker.name}</TableCell>
                  <TableCell className="font-body">${sticker.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={sticker.stock === undefined ? 'outline' : (sticker.stock > 10 ? 'default' : (sticker.stock > 0 ? 'secondary' : 'destructive'))}>
                      {sticker.stock !== undefined ? sticker.stock : 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-body text-muted-foreground">{sticker.category || 'Uncategorized'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="hover:text-primary" onClick={() => handleOpenForm(sticker)}>
                      <Edit3 className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    {/* TODO: Implement confirmation dialog for delete */}
                    <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => handleDeleteProduct(sticker.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <PackageOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-xl font-semibold text-muted-foreground font-headline">No stickers found matching your search.</p>
                <p className="text-muted-foreground font-body">Try a different search term or add new products.</p>
            </div>
        )}
      </div>
    </AdminLayout>
  );
}
