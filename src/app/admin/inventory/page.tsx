
'use client';

import { useState, useEffect } from 'react';
import type { Sticker } from '@/types';
// MOCK_STICKERS is no longer the primary source of data
// import { MOCK_STICKERS } from '@/data/sticker-data'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Edit3, Trash2, Search, PackageOpen, Image as ImageIcon, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import NextImage from 'next/image'; 
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
import { getStickersFromDB, addStickerToDB, updateStickerInDB, deleteStickerFromDB } from '@/services/stickerService';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


export default function AdminInventoryPage() {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [isLoadingDB, setIsLoadingDB] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSticker, setEditingSticker] = useState<Sticker | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchStickers = async () => {
    setIsLoadingDB(true);
    const dbStickers = await getStickersFromDB();
    setStickers(dbStickers);
    setIsLoadingDB(false);
  };

  useEffect(() => {
    fetchStickers();
  }, []);

  const filteredStickers = stickers.filter(sticker =>
    sticker.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenForm = (sticker: Sticker | null = null) => {
    setEditingSticker(sticker);
    setIsFormOpen(true);
  };

  const handleSaveProduct = async (
    formData: Omit<Sticker, 'id'> & { id?: string; }, 
    imageFiles: File[], 
    videoFiles: File[]
  ) => {
    setIsSubmitting(true);
    
    // This part remains client-side simulation for URL generation
    // In a real app, upload files to Firebase Storage here and get actual URLs
    const newImageUrls = [...(formData.imageUrls || [])]; 
    if (imageFiles.length > 0) {
        newImageUrls.push(...imageFiles.map(f => `https://placehold.co/100x100.png?text=New+Img-${f.name.substring(0,3)}`));
    }
    const newVideoUrls = [...(formData.videoUrls || [])];
    if (videoFiles.length > 0) {
        newVideoUrls.push(...videoFiles.map(f => `https://placehold.co/160x90.png?text=New+Vid-${f.name.substring(0,3)}`));
    }

    const stickerDataPayload = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        stock: formData.stock,
        category: formData.category,
        tags: formData.tags, // Assuming tags is already an array or correctly formatted string for DB
        availableMaterials: formData.availableMaterials,
        imageUrls: newImageUrls,
        videoUrls: newVideoUrls,
    };

    let success = false;
    if (editingSticker && formData.id) {
      // Update existing sticker
      success = await updateStickerInDB(formData.id, stickerDataPayload);
      if (success) {
        toast({ title: "Product Updated", description: `${formData.name} has been updated.` });
      } else {
        toast({ title: "Error", description: `Failed to update ${formData.name}.`, variant: "destructive" });
      }
    } else {
      // Add new sticker
      const newId = await addStickerToDB(stickerDataPayload as Omit<Sticker, 'id'>);
      if (newId) {
        success = true;
        toast({ title: "Product Added", description: `${formData.name} has been added.` });
      } else {
        toast({ title: "Error", description: `Failed to add ${formData.name}.`, variant: "destructive" });
      }
    }

    if (success) {
      await fetchStickers(); // Refresh list from DB
    }
    
    setIsSubmitting(false);
    setIsFormOpen(false);
    setEditingSticker(null);
  };
  
  const handleDeleteProduct = async (stickerId: string, stickerName: string) => {
    setIsSubmitting(true); // Use general submitting state or a specific deleting state
    const success = await deleteStickerFromDB(stickerId);
    if (success) {
      toast({ title: "Product Deleted", description: `${stickerName} has been removed.` });
      await fetchStickers(); // Refresh list
    } else {
      toast({ title: "Error Deleting", description: `Could not remove ${stickerName}.`, variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  if (isLoadingDB) {
    return (
      <AdminLayout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg font-semibold">Loading Inventory...</p>
        </div>
      </AdminLayout>
    );
  }

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
                setEditingSticker(null); 
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

        {filteredStickers.length === 0 && !isLoadingDB ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <PackageOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-xl font-semibold text-muted-foreground font-headline">
                  {searchTerm ? "No stickers found matching your search." : "No stickers in inventory."}
                </p>
                <p className="text-muted-foreground font-body">
                  {searchTerm ? "Try a different search term." : "Add your first product to get started!"}
                </p>
                 {!searchTerm && (
                    <Button onClick={() => handleOpenForm(null)} className="mt-4">
                        <PlusCircle className="mr-2 h-5 w-5" /> Add Product
                    </Button>
                 )}
            </div>
        ) : (
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
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:text-destructive" disabled={isSubmitting}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the sticker "{sticker.name}" from the database.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteProduct(sticker.id, sticker.name)} 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        )}
      </div>
    </AdminLayout>
  );
}

