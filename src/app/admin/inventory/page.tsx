
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
import { useAuth } from '@/contexts/auth-context';


export default function AdminInventoryPage() {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [isLoadingDB, setIsLoadingDB] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSticker, setEditingSticker] = useState<Sticker | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { currentUser, isAdmin } = useAuth();

  const fetchStickers = async () => {
    setIsLoadingDB(true);
    console.log("CLIENT: Fetching stickers from DB...");
    const dbStickers = await getStickersFromDB();
    console.log("CLIENT: Fetched stickers:", dbStickers);
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
    formData: Omit<Sticker, 'id' | 'tags' | 'imageUrls' | 'videoUrls' | 'availableMaterials'> & { id?: string; tags?: string; category?: string; availableMaterials: string[]; imageUrls?: string[]; videoUrls?: string[] },
    imageFiles: File[],
    videoFiles: File[]
  ) => {
    setIsSubmitting(true);
    console.log("CLIENT: --- Attempting to save product ---");
    console.log("CLIENT: Current user from useAuth (at save point):", JSON.stringify(currentUser, null, 2));
    console.log("CLIENT: Current user email from useAuth (at save point):", currentUser?.email);
    console.log("CLIENT: Is Admin (from useAuth, at save point):", isAdmin);
    console.log("CLIENT: Raw form data received:", formData);
    console.log("CLIENT: Image files selected:", imageFiles.map(f => f.name));
    console.log("CLIENT: Video files selected:", videoFiles.map(f => f.name));

    if (currentUser?.uid === 'admin-static-id') {
        const errorMsg = "Static admin account cannot save to the database. Please use Google Sign-In with an authorized admin email.";
        console.error("CLIENT: " + errorMsg);
        toast({
            title: "Operation Denied",
            description: errorMsg,
            variant: "destructive",
            duration: 7000,
        });
        setIsSubmitting(false);
        setIsFormOpen(false);
        setEditingSticker(null);
        console.log("CLIENT: --- Product save attempt finished (aborted due to static admin) ---");
        return;
    }


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

    const stickerTags: string[] = formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];
    console.log("CLIENT: Processed sticker tags:", stickerTags);

    const stickerDataPayload = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        stock: formData.stock,
        category: formData.category || '',
        tags: stickerTags,
        availableMaterials: formData.availableMaterials,
        imageUrls: newImageUrls,
        videoUrls: newVideoUrls,
    };
    console.log("CLIENT: Sticker data payload to be sent to DB service:", stickerDataPayload);

    let success = false;
    let operationType = editingSticker && formData.id ? "update" : "add";
    let serverErrorMessage: string | null = null;

    try {
      if (operationType === "update" && formData.id) {
        console.log(`CLIENT: Attempting to update sticker with ID: ${formData.id}`);
        const result = await updateStickerInDB(formData.id, stickerDataPayload);
        if (result === true) {
          success = true;
          toast({ title: "Product Updated", description: `${formData.name} has been updated.` });
          console.log(`CLIENT: Product ${formData.name} updated successfully.`);
        } else {
          serverErrorMessage = typeof result === 'string' ? result : "Failed to update product. Ensure admin authentication.";
           const detailedDescription = serverErrorMessage.includes("permission-denied")
            ? `FIRESTORE PERMISSION DENIED: ${serverErrorMessage}\n\n` +
              `CRITICAL: Firestore rules are blocking this update for user '${currentUser?.email}'.\n` +
              `TROUBLESHOOTING CHECKLIST:\n` +
              `1. VERIFY LOGGED-IN EMAIL: You are logged in as '${currentUser?.email}'. Your Firestore rule needs to check against this exact email.\n` +
              `2. FIRESTORE RULE CHECK (In Firebase Console > Firestore Database > Rules tab):\n` +
              `   - TARGET PATH: '/stickers/{stickerId}' (or the specific path for your stickers collection).\n` +
              `   - ADMIN CHECK RULE (EXAMPLE): 'allow write: if request.auth != null && request.auth.token.email.lower() == "YOUR_ADMIN_EMAIL_HERE".lower();'\n` +
              `   - VERIFY EMAIL IN RULE: Replace "YOUR_ADMIN_EMAIL_HERE" with your actual admin email ('${currentUser?.email?.toLowerCase()}'). It MUST BE an EXACT match (no typos, no extra spaces).\n` +
              `   - CASE-INSENSITIVE: Ensure '.lower()' is used on BOTH 'request.auth.token.email' AND your admin email string in the rule for reliable matching.\n` +
              `3. PUBLISH RULES: After any change to rules, YOU MUST CLICK "PUBLISH". Changes are not live otherwise.\n` +
              `4. FIRESTORE SIMULATOR: Use the "Simulator" in the Rules tab. Test an 'update' operation on path 'stickers/${formData.id}'. Set 'Authenticated' to true, provider 'google.com', and input your admin email ('${currentUser?.email}'). It should show 'Simulated write allowed'. If not, your rule is incorrect.`
            : serverErrorMessage;
          toast({ title: "Error Updating Product", description: detailedDescription, variant: "destructive", duration: 10000 });
          console.error(`CLIENT: Failed to update product ${formData.name}. Server response: ${serverErrorMessage}`);
        }
      } else {
        console.log(`CLIENT: Attempting to add new sticker: ${formData.name}`);
        const result = await addStickerToDB(stickerDataPayload as Omit<Sticker, 'id'>);
        if (result && !result.startsWith('Server Error:')) {
          success = true;
          toast({ title: "Product Added", description: `${formData.name} has been added.` });
          console.log(`CLIENT: Product ${formData.name} added successfully with ID: ${result}.`);
        } else {
          serverErrorMessage = typeof result === 'string' ? result : "Failed to add product. Ensure admin authentication.";
           const detailedDescription = serverErrorMessage.includes("permission-denied")
            ? `FIRESTORE PERMISSION DENIED: ${serverErrorMessage}\n\n` +
              `CRITICAL: Firestore rules are blocking this 'add' (create) operation for user '${currentUser?.email}'.\n` +
              `TROUBLESHOOTING CHECKLIST:\n` +
              `1. VERIFY LOGGED-IN EMAIL: You are logged in as '${currentUser?.email}'. Your Firestore rule needs to check against this exact email.\n` +
              `2. FIRESTORE RULE CHECK (In Firebase Console > Firestore Database > Rules tab):\n` +
              `   - TARGET PATH: '/stickers/{stickerId}' (this rule applies to creating new documents in the 'stickers' collection).\n` +
              `   - ADMIN CHECK RULE (EXAMPLE): 'allow write: if request.auth != null && request.auth.token.email.lower() == "YOUR_ADMIN_EMAIL_HERE".lower();'\n` +
              `   - VERIFY EMAIL IN RULE: Replace "YOUR_ADMIN_EMAIL_HERE" with your actual admin email ('${currentUser?.email?.toLowerCase()}'). It MUST BE an EXACT match (no typos, no extra spaces).\n` +
              `   - CASE-INSENSITIVE: Ensure '.lower()' is used on BOTH 'request.auth.token.email' AND your admin email string in the rule for reliable matching.\n` +
              `3. PUBLISH RULES: After any change to rules, YOU MUST CLICK "PUBLISH". Changes are not live otherwise.\n` +
              `4. FIRESTORE SIMULATOR: Use the "Simulator" in the Rules tab. Test a 'create' operation on path 'stickers/someNewStickerId'. Set 'Authenticated' to true, provider 'google.com', and input your admin email ('${currentUser?.email}'). It should show 'Simulated write allowed'. If not, your rule is incorrect or not targeting the 'create' operation correctly (though 'write' covers create, update, delete).`
            : serverErrorMessage;
          toast({ title: "Error Adding Product", description: detailedDescription, variant: "destructive", duration: 10000 });
          console.error(`CLIENT: Failed to add product ${formData.name}. Server response: ${serverErrorMessage}`);
        }
      }
    } catch (error: any) {
      serverErrorMessage = `An unexpected error occurred on the client. Message: ${error.message || 'Unknown error'}.`;
      console.error(`CLIENT: CRITICAL ERROR during ${operationType} product ${formData.name}:`, error);
      toast({ title: "Critical Client Error", description: serverErrorMessage, variant: "destructive", duration: 7000 });
      success = false;
    }


    if (success) {
      await fetchStickers();
    }

    setIsSubmitting(false);
    setIsFormOpen(false);
    setEditingSticker(null);
    console.log("CLIENT: --- Product save attempt finished ---");
  };

  const handleDeleteProduct = async (stickerId: string, stickerName: string) => {
    setIsSubmitting(true);
    console.log(`CLIENT: --- Attempting to delete product ID: ${stickerId}, Name: ${stickerName} ---`);
    console.log("CLIENT: Current user from useAuth (at delete point):", JSON.stringify(currentUser, null, 2));
    console.log("CLIENT: Current user email from useAuth (at delete point):", currentUser?.email);
    console.log("CLIENT: Is Admin (from useAuth, at delete point):", isAdmin);

    if (currentUser?.uid === 'admin-static-id') {
        const errorMsg = "Static admin account cannot delete from the database. Please use Google Sign-In.";
        console.error("CLIENT: " + errorMsg);
        toast({
            title: "Operation Denied",
            description: errorMsg,
            variant: "destructive",
            duration: 7000,
        });
        setIsSubmitting(false);
        return;
    }

    const result = await deleteStickerFromDB(stickerId);
    if (result === true) {
      toast({ title: "Product Deleted", description: `${stickerName} has been removed.` });
      console.log(`CLIENT: Product ${stickerName} deleted successfully.`);
      await fetchStickers();
    } else {
      let serverErrorMessage = typeof result === 'string' ? result : `Could not remove ${stickerName}. Ensure admin authentication.`;
      const detailedDescription = serverErrorMessage.includes("permission-denied")
        ? `FIRESTORE PERMISSION DENIED: ${serverErrorMessage}\n\n` +
          `CRITICAL: Firestore rules are blocking this 'delete' for user '${currentUser?.email}'.\n` +
          `TROUBLESHOOTING:\n` +
          `1. VERIFY LOGGED-IN EMAIL: You are logged in as '${currentUser?.email}'.\n` +
          `2. FIRESTORE RULE CHECK: Ensure your Firestore rule for '/stickers/{stickerId}' allows 'delete' for admin '${currentUser?.email?.toLowerCase()}' (usually covered by 'allow write', which includes delete).\n` +
          `   - The rule 'allow write: if request.auth.token.email.lower() == "${currentUser?.email?.toLowerCase()}".lower();' should work.\n` +
          `3. PUBLISH RULES & SIMULATOR: Confirm rules are PUBLISHED and test 'delete' on 'stickers/${stickerId}' with Firestore Rules Simulator for user '${currentUser?.email}'.`
        : serverErrorMessage;
      toast({ title: "Error Deleting Product", description: detailedDescription, variant: "destructive", duration: 10000 });
      console.error(`CLIENT: Failed to delete product ${stickerName}. Server response: ${serverErrorMessage}`);
    }
    setIsSubmitting(false);
    console.log("CLIENT: --- Product delete attempt finished ---");
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
