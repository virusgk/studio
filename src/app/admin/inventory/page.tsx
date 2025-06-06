'use client';

import { useState } from 'react';
import type { Sticker } from '@/types';
import { MOCK_STICKERS } from '@/data/sticker-data'; // Using mock data for now
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Edit3, Trash2, Search, PackageOpen } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AdminLayout from "../layout"; // Assuming this layout checks auth
// Placeholder for ProductForm - would be a more complex component
// import { ProductForm } from '@/components/admin/product-form'; 

export default function AdminInventoryPage() {
  const [stickers, setStickers] = useState<Sticker[]>(MOCK_STICKERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSticker, setEditingSticker] = useState<Sticker | null>(null);

  const filteredStickers = stickers.filter(sticker =>
    sticker.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = () => {
    setEditingSticker(null);
    setIsFormOpen(true);
    // Logic to add a new product - would typically involve a form
    // For now, we can add a dummy product or open a form modal
    // const newSticker: Sticker = { id: `sticker-${Date.now()}`, name: 'New Sticker', description: 'A fresh design', imageUrl: 'https://placehold.co/100x100.png', price: 2.99, availableMaterials: ['vinyl-glossy'], stock: 50 };
    // setStickers(prev => [newSticker, ...prev]);
  };

  const handleEditProduct = (sticker: Sticker) => {
    setEditingSticker(sticker);
    setIsFormOpen(true);
  };

  const handleDeleteProduct = (stickerId: string) => {
    // Add confirmation dialog here
    setStickers(prev => prev.filter(s => s.id !== stickerId));
  };
  
  const ProductFormPlaceholder = ({sticker, onSave, onCancel}: {sticker: Sticker | null, onSave: (data: any) => void, onCancel: () => void}) => (
    <div className="space-y-4 p-2">
        <h3 className="font-headline text-lg">{sticker ? 'Edit Sticker' : 'Add New Sticker'}</h3>
        <Input defaultValue={sticker?.name || ''} placeholder="Sticker Name" />
        <Input type="number" defaultValue={sticker?.price || 0} placeholder="Price" />
        <Input type="number" defaultValue={sticker?.stock || 0} placeholder="Stock" />
        <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={() => onSave({})}>Save (Placeholder)</Button>
        </div>
    </div>
  );


  return (
    <AdminLayout>
      <div className="space-y-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-headline text-primary">Inventory Management</h1>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button onClick={handleAddProduct}>
                    <PlusCircle className="mr-2 h-5 w-5" /> Add Product
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="font-headline">{editingSticker ? 'Edit Sticker' : 'Add New Sticker'}</DialogTitle>
                    <DialogDescription className="font-body">
                        {editingSticker ? `Update details for ${editingSticker.name}.` : 'Fill in the details for the new sticker.'}
                    </DialogDescription>
                </DialogHeader>
                {/* Replace with actual ProductForm component */}
                <ProductFormPlaceholder 
                    sticker={editingSticker}
                    onSave={(data) => {
                        console.log("Save data:", data); // Placeholder save
                        setIsFormOpen(false);
                    }}
                    onCancel={() => setIsFormOpen(false)}
                />
            </DialogContent>
          </Dialog>
        </div>

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
                    <Image
                      src={sticker.imageUrl}
                      alt={sticker.name}
                      width={50}
                      height={50}
                      className="rounded-md object-cover border"
                      data-ai-hint="sticker product"
                    />
                  </TableCell>
                  <TableCell className="font-medium font-body">{sticker.name}</TableCell>
                  <TableCell className="font-body">${sticker.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={sticker.stock && sticker.stock > 10 ? 'default' : (sticker.stock && sticker.stock > 0 ? 'secondary' : 'destructive')}>
                      {sticker.stock !== undefined ? sticker.stock : 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-body text-muted-foreground">{sticker.category || 'Uncategorized'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="hover:text-primary" onClick={() => handleEditProduct(sticker)}>
                      <Edit3 className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
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
