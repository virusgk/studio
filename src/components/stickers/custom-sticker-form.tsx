'use client';

import { useState, type ChangeEvent } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { STICKER_MATERIALS, MOCK_STICKERS } from '@/data/sticker-data'; // Using materials from mock data
import { checkImageResolution } from '@/ai/flows/check-image-resolution';
import type { ImageResolutionResult } from '@/types';
import Image from 'next/image';
import { UploadCloud, CheckCircle2, XCircle, Loader2, ShoppingCart, Palette } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const MIN_WIDTH = 300; // Minimum width in pixels
const MIN_HEIGHT = 300; // Minimum height in pixels

const customStickerSchema = z.object({
  image: z.any().refine(fileList => fileList && fileList.length === 1, 'Image is required.'),
  materialId: z.string().min(1, 'Material is required.'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1').max(100, 'Maximum 100 stickers'),
  notes: z.string().optional(),
});

type CustomStickerFormData = z.infer<typeof customStickerSchema>;

export function CustomStickerForm() {
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCheckingResolution, setIsCheckingResolution] = useState(false);
  const [resolutionResult, setResolutionResult] = useState<ImageResolutionResult | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const form = useForm<CustomStickerFormData>({
    resolver: zodResolver(customStickerSchema),
    defaultValues: {
      quantity: 1,
      notes: '',
    },
  });

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type (optional, but good practice)
      if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid File Type", description: "Please upload an image file.", variant: "destructive" });
        form.resetField("image");
        setPreviewUrl(null);
        setImageDataUri(null);
        setResolutionResult(null);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUri = reader.result as string;
        setPreviewUrl(dataUri);
        setImageDataUri(dataUri);
        setResolutionResult(null); // Reset previous result
        setIsCheckingResolution(true);
        try {
          const result = await checkImageResolution({
            imageDataUri: dataUri,
            minWidth: MIN_WIDTH,
            minHeight: MIN_HEIGHT,
          });
          setResolutionResult(result);
          if (!result.isResolutionMet) {
             toast({
              title: "Image Resolution Issue",
              description: result.message,
              variant: "destructive",
              duration: 7000,
            });
          } else {
            toast({
              title: "Image Resolution OK",
              description: `Dimensions: ${result.width}x${result.height}px. ${result.message}`,
              variant: "default", // 'default' or a success variant if you have one
            });
          }
        } catch (error) {
          console.error("Error checking image resolution:", error);
          toast({ title: "Error", description: "Could not check image resolution.", variant: "destructive" });
          setResolutionResult({ isResolutionMet: false, width: 0, height: 0, message: "Error checking resolution."});
        } finally {
          setIsCheckingResolution(false);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
      setImageDataUri(null);
      setResolutionResult(null);
      form.resetField("image");
    }
  };

  const onSubmit: SubmitHandler<CustomStickerFormData> = async (data) => {
    setIsSubmitting(true);
    if (!resolutionResult || !resolutionResult.isResolutionMet) {
      toast({
        title: 'Cannot Submit',
        description: 'Please upload an image that meets the resolution requirements.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Custom Sticker Data:', { ...data, imageDataUri });
    toast({
      title: 'Custom Sticker Added to Cart!',
      description: 'We\'ve added your masterpiece to your cart.',
    });
    form.reset();
    setPreviewUrl(null);
    setImageDataUri(null);
    setResolutionResult(null);
    setIsSubmitting(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => ( // `field` is not directly used for Input type file, onChange handled separately
            <FormItem>
              <FormLabel htmlFor="image-upload" className="text-lg font-headline">Upload Your Design</FormLabel>
              <FormControl>
                <div className="mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10 hover:border-primary transition-colors">
                  <div className="text-center">
                    {previewUrl ? (
                      <div className="relative mx-auto h-48 w-48 mb-4 overflow-hidden rounded-md border border-muted shadow-sm">
                        <Image src={previewUrl} alt="Image preview" layout="fill" objectFit="contain" />
                      </div>
                    ) : (
                      <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
                    )}
                    <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                      <label
                        htmlFor="image-upload"
                        className="relative cursor-pointer rounded-md bg-background font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80"
                      >
                        <span>Upload a file</span>
                        <Input 
                          id="image-upload" 
                          type="file" 
                          className="sr-only" 
                          accept="image/*"
                          onChange={(e) => {
                            field.onChange(e.target.files); // Update react-hook-form state
                            handleImageChange(e); // Call custom handler
                          }}
                          disabled={isCheckingResolution || isSubmitting}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs leading-5 text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                     <p className="text-xs leading-5 text-muted-foreground">Minimum {MIN_WIDTH}x{MIN_HEIGHT} pixels recommended.</p>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isCheckingResolution && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle className="font-headline">Checking Resolution...</AlertTitle>
            <AlertDescription>Please wait while we analyze your image.</AlertDescription>
          </Alert>
        )}

        {resolutionResult && !isCheckingResolution && (
          <Alert variant={resolutionResult.isResolutionMet ? 'default' : 'destructive'}>
            {resolutionResult.isResolutionMet ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <AlertTitle className="font-headline">
              {resolutionResult.isResolutionMet ? 'Resolution OK!' : 'Resolution Issue'}
            </AlertTitle>
            <AlertDescription>
              {resolutionResult.message} (Detected: {resolutionResult.width}x{resolutionResult.height}px)
            </AlertDescription>
          </Alert>
        )}
        
        <FormField
          control={form.control}
          name="materialId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-headline">Choose Material</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={isCheckingResolution || isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <Palette className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select a material" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {STICKER_MATERIALS.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name} <span className="text-xs text-muted-foreground ml-2">- {material.description}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="quantity" className="text-lg font-headline">Quantity</FormLabel>
              <FormControl>
                <Input 
                  id="quantity" 
                  type="number" 
                  min="1" 
                  max="100" 
                  {...field} 
                  disabled={isCheckingResolution || isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="notes" className="text-lg font-headline">Additional Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  id="notes"
                  placeholder="Any special instructions? e.g., specific cut, white border, etc."
                  className="resize-none"
                  {...field}
                  disabled={isCheckingResolution || isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full" 
          size="lg"
          disabled={isCheckingResolution || !resolutionResult?.isResolutionMet || isSubmitting}
        >
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-5 w-5" />}
          {isSubmitting ? 'Processing...' : 'Add to Cart'}
        </Button>
      </form>
    </Form>
  );
}
