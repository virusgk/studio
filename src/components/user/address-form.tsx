'use client';

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Address } from '@/types';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Save, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const addressSchema = z.object({
  name: z.string().min(2, 'Full name is required (min 2 chars).'),
  street: z.string().min(5, 'Street address is required (min 5 chars).'),
  city: z.string().min(2, 'City is required (min 2 chars).'),
  state: z.string().min(2, 'State/Province is required (min 2 chars).'),
  zip: z.string().min(3, 'ZIP/Postal code is required (min 3 chars).'),
  country: z.string().min(2, 'Country is required (min 2 chars).'),
});

interface AddressFormProps {
  initialData?: Address | null;
}

export function AddressForm({ initialData }: AddressFormProps) {
  const { saveAddress } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<Address>({
    resolver: zodResolver(addressSchema),
    defaultValues: initialData || {
      name: '',
      street: '',
      city: '',
      state: '',
      zip: '',
      country: '',
    },
  });
  
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);


  const onSubmit: SubmitHandler<Address> = async (data) => {
    setIsSubmitting(true);
    try {
      await saveAddress(data);
      toast({
        title: 'Address Saved!',
        description: 'Your shipping address has been updated.',
      });
    } catch (error) {
      console.error("Failed to save address:", error);
      toast({
        title: 'Error Saving Address',
        description: 'Could not update your address. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="street"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address</FormLabel>
              <FormControl><Input placeholder="e.g., 123 Sticker Lane" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl><Input placeholder="e.g., Sticker City" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State / Province</FormLabel>
                <FormControl><Input placeholder="e.g., California" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="zip"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ZIP / Postal Code</FormLabel>
                <FormControl><Input placeholder="e.g., 90210" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl><Input placeholder="e.g., USA" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
          {isSubmitting ? 'Saving...' : 'Save Address'}
        </Button>
      </form>
    </Form>
  );
}
