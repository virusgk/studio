
'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Sticker, MaterialOption } from '@/types';
import { STICKER_MATERIALS } from '@/data/sticker-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { UploadCloud, X, Video, Image as ImageIcon, Loader2, Save } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const productFormSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  price: z.coerce.number().min(0.01, 'Price must be positive.'),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative.'),
  category: z.string().optional(),
  tags: z.string().optional(), // comma-separated
  availableMaterials: z.array(z.string()).min(1, "At least one material must be selected."),
  // images and videos will be handled outside standard form data due to File objects
});

type ProductFormData = Omit<z.infer<typeof productFormSchema>, 'imageUrls' | 'videoUrls'> & {
  id?: string; // For editing
  imageUrls?: string[]; // Existing URLs
  videoUrls?: string[]; // Existing URLs
};

interface ProductFormProps {
  sticker?: Sticker | null;
  onSave: (data: ProductFormData, imageFiles: File[], videoFiles: File[]) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function ProductForm({ sticker, onSave, onCancel, isSubmitting }: ProductFormProps) {
  const { toast } = useToast();
  
  const [imagePreviews, setImagePreviews] = useState<string[]>(sticker?.imageUrls || []);
  const [videoPreviews, setVideoPreviews] = useState<string[]>(sticker?.videoUrls || []);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      id: sticker?.id,
      name: sticker?.name || '',
      description: sticker?.description || '',
      price: sticker?.price || 0,
      stock: sticker?.stock || 0,
      category: sticker?.category || '',
      tags: sticker?.tags?.join(', ') || '',
      availableMaterials: sticker?.availableMaterials || [],
      imageUrls: sticker?.imageUrls || [],
      videoUrls: sticker?.videoUrls || [],
    },
  });

  useEffect(() => {
    if (sticker) {
      form.reset({
        id: sticker.id,
        name: sticker.name,
        description: sticker.description,
        price: sticker.price,
        stock: sticker.stock,
        category: sticker.category || '',
        tags: sticker.tags?.join(', ') || '',
        availableMaterials: sticker.availableMaterials,
        imageUrls: sticker.imageUrls,
        videoUrls: sticker.videoUrls,
      });
      setImagePreviews(sticker.imageUrls || []);
      setVideoPreviews(sticker.videoUrls || []);
      setImageFiles([]);
      setVideoFiles([]);
    }
  }, [sticker, form]);

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setImageFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const handleVideoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
     if (files.length > 0) {
      setVideoFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setVideoPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      const newImageUrls = form.getValues('imageUrls')?.filter((_, i) => i !== index) || [];
      form.setValue('imageUrls', newImageUrls);
      setImagePreviews(newImageUrls);
    } else {
      setImageFiles(prev => prev.filter((_, i) => i !== index));
      setImagePreviews(prev => prev.filter((url, i) => {
        if (url.startsWith('blob:')) { // Heuristic for new previews
          // This logic needs to be more robust if mixing existing and new previews removal
          // For now, assume removal order matches file order for new files.
          // This simplified removal is tricky if existing URLs are also blob URLs or if order is not guaranteed.
          // A better way would be to associate previews with their File objects or original URLs.
          const newFileIndex = prev.findIndex(p => p === url) - (form.getValues('imageUrls')?.length || 0);
          return newFileIndex !== index;
        }
        return true; // Keep existing URLs not matching by index with blob (which is imperfect)
      }).filter((_,i) => i !== (index + (form.getValues('imageUrls')?.length || 0))));
    }
  };
  
  const removeVideo = (index: number, isExisting: boolean) => {
    if (isExisting) {
       const newVideoUrls = form.getValues('videoUrls')?.filter((_, i) => i !== index) || [];
      form.setValue('videoUrls', newVideoUrls);
      setVideoPreviews(newVideoUrls);
    } else {
      // Similar logic as removeImage for new files
      setVideoFiles(prev => prev.filter((_, i) => i !== index));
      setVideoPreviews(prev => prev.filter((url, i) => {
         if (url.startsWith('blob:')) {
           const newFileIndex = prev.findIndex(p => p === url) - (form.getValues('videoUrls')?.length || 0);
           return newFileIndex !== index;
         }
         return true;
      }).filter((_,i) => i !== (index + (form.getValues('videoUrls')?.length || 0))));
    }
  };


  const onSubmitHandler: SubmitHandler<ProductFormData> = (data) => {
    // Combine existing URLs with new file data (actual upload handled by parent)
    const finalData = {
      ...data,
      // Parent will decide how to handle existing URLs vs new files
    };
    onSave(finalData, imageFiles, videoFiles);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitHandler)} className="space-y-6">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl><Input placeholder="Sticker Name" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl><Textarea placeholder="Detailed description..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="price" render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="stock" render={({ field }) => (
            <FormItem>
              <FormLabel>Stock</FormLabel>
              <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        
        <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl><Input placeholder="e.g. Animals, Abstract" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

        <FormField control={form.control} name="tags" render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl><Input placeholder="e.g. cute, space, funny (comma-separated)" {...field} /></FormControl>
               <FormDescription>Comma-separated values.</FormDescription>
              <FormMessage />
            </FormItem>
          )} />

        <FormField control={form.control} name="availableMaterials" render={() => (
          <FormItem>
            <FormLabel>Available Materials</FormLabel>
            <div className="grid grid-cols-2 gap-2">
            {STICKER_MATERIALS.map((material) => (
              <FormField
                key={material.id}
                control={form.control}
                name="availableMaterials"
                render={({ field }) => {
                  return (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(material.id)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...(field.value || []), material.id])
                              : field.onChange(
                                  (field.value || []).filter(
                                    (value) => value !== material.id
                                  )
                                )
                          }}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        {material.name}
                      </FormLabel>
                    </FormItem>
                  )
                }}
              />
            ))}
            </div>
            <FormMessage />
          </FormItem>
        )} />

        {/* Image Upload */}
        <FormItem>
            <FormLabel>Product Images</FormLabel>
            <FormControl>
                 <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md hover:border-primary">
                    <div className="space-y-1 text-center">
                        <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
                        <div className="flex text-sm text-muted-foreground">
                        <label htmlFor="image-upload" className="relative cursor-pointer rounded-md bg-card font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                            <span>Upload images</span>
                            <Input id="image-upload" type="file" className="sr-only" multiple accept="image/*" onChange={handleImageFileChange} />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB each</p>
                    </div>
                </div>
            </FormControl>
            {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {imagePreviews.map((src, index) => (
                <div key={index} className="relative group aspect-square">
                  <Image src={src} alt={`Preview ${index + 1}`} layout="fill" objectFit="cover" className="rounded-md border" />
                  <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-70 group-hover:opacity-100" onClick={() => removeImage(index, !src.startsWith('blob:'))}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            )}
        </FormItem>

        {/* Video Upload */}
         <FormItem>
            <FormLabel>Product Videos (Optional)</FormLabel>
            <FormControl>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md hover:border-primary">
                    <div className="space-y-1 text-center">
                        <Video className="mx-auto h-10 w-10 text-muted-foreground" />
                        <div className="flex text-sm text-muted-foreground">
                        <label htmlFor="video-upload" className="relative cursor-pointer rounded-md bg-card font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                            <span>Upload videos</span>
                            <Input id="video-upload" type="file" className="sr-only" multiple accept="video/*" onChange={handleVideoFileChange} />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-muted-foreground">MP4, WEBM up to 50MB each</p>
                    </div>
                </div>
            </FormControl>
            {videoPreviews.length > 0 && (
             <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {videoPreviews.map((src, index) => (
                    <div key={index} className="relative group aspect-video">
                    <video src={src} controls className="rounded-md border w-full h-full object-cover"></video>
                    <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-70 group-hover:opacity-100" onClick={() => removeVideo(index, !src.startsWith('blob:'))}>
                        <X className="h-4 w-4" />
                    </Button>
                    </div>
                ))}
             </div>
            )}
        </FormItem>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSubmitting ? (sticker ? 'Updating...' : 'Adding...') : (sticker ? 'Update Product' : 'Add Product')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
