'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LogIn } from 'lucide-react';

const adminLoginSchema = z.object({
  username: z.string().min(1, { message: 'Username is required' }).refine(val => val === 'admin', { message: "Invalid username"}),
  password: z.string().min(1, { message: 'Password is required' }),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

export function AdminLoginForm() {
  const { adminLogin } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit: SubmitHandler<AdminLoginFormData> = async (data) => {
    setIsLoading(true);
    // Only attempt login if username is 'admin'
    if (data.username !== 'admin') {
        form.setError("username", { type: "manual", message: "Invalid username" });
        setIsLoading(false);
        return;
    }
    const success = await adminLogin(data.password);
    if (!success) {
      toast({
        title: 'Admin Login Failed',
        description: 'Invalid password for admin.',
        variant: 'destructive',
      });
      form.setError("password", { type: "manual", message: "Invalid password" });
    }
    setIsLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="admin-username">Admin Username</FormLabel>
              <FormControl>
                <Input
                  id="admin-username"
                  placeholder="admin"
                  autoCapitalize="none"
                  autoComplete="username"
                  autoCorrect="off"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="admin-password">Password</FormLabel>
              <FormControl>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Logging in...' : <><LogIn className="mr-2 h-5 w-5" />Login as Admin</>}
        </Button>
      </form>
    </Form>
  );
}
