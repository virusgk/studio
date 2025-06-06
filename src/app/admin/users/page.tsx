
'use client';

import { useState, useEffect } from 'react';
import type { UserDocument } from '@/types';
import AdminLayout from "../layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Users, ShieldCheck, ShieldOff, ShieldAlert } from 'lucide-react';
import { getAllUsers, updateUserRole } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null); // Store UID of user being updated
  const { toast } = useToast();
  const { currentUser } = useAuth(); // To prevent self-role change & for specific error messages

  const fetchUsers = async () => {
    setIsLoading(true);
    const fetchedUsers = await getAllUsers();
    setUsers(fetchedUsers);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, currentRole: 'admin' | 'user') => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    // Prevent dynamic admin from revoking their own admin status
    if (userId === currentUser?.uid && newRole === 'user' && currentUser?.role === 'admin' && currentUser.uid !== 'admin-static-id') {
      toast({
        title: "Action Denied",
        description: "You cannot revoke your own admin status.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingRole(userId);
    const result = await updateUserRole(userId, newRole);
    if (result === true) {
      toast({
        title: "Role Updated",
        description: `User role changed to ${newRole}.`,
      });
      await fetchUsers(); // Re-fetch users to update the table
    } else {
      let detailedDescription = typeof result === 'string' ? result : "Could not update user role. Check Firestore rules and server logs.";
      
      // Enhance message if static admin faces permission issue
      if (currentUser?.uid === 'admin-static-id' && typeof result === 'string' && result.includes("permission-denied")) {
        detailedDescription = `STATIC ADMIN PERMISSION DENIED: ${result}\n\n` +
        `This means the Firestore rule for '/users/{userId}' (allow update) is not correctly configured for the static admin ('admin-static-id').\n\n` +
        `TROUBLESHOOTING CHECKLIST:\n` +
        `1. VERIFY FIRESTORE RULE: In Firebase Console > Firestore > Rules, ensure 'allow update' for 'match /users/{userId}' path includes a condition specifically for the static admin. It should look similar to:\n` +
        `   '(request.auth != null && request.auth.uid == 'admin-static-id' && request.resource.data.keys().hasAny(['role', 'lastLogin']))'\n` +
        `2. EXACT STATIC ID: Ensure 'admin-static-id' in the rule EXACTLY matches the ID used in the application's AuthContext.\n` +
        `3. ALLOWED FIELDS: The rule example restricts static admin to update only 'role' and/or 'lastLogin'. Ensure the updateUserRole service is only attempting to update these.\n` +
        `4. PUBLISH RULES: Crucially, ensure any changes to Firestore rules are PUBLISHED. Changes are not live otherwise.\n` +
        `5. SIMULATOR: Use the Firestore Rules Simulator to test an 'update' operation on a path like 'users/someUserId' with 'Authenticated' checked, Provider 'custom', and UID 'admin-static-id'. The request data should be e.g., {'role': 'admin'}. It should be ALLOWED.`;
      }

      toast({
        title: "Error Updating Role",
        description: detailedDescription,
        variant: "destructive",
        duration: 12000, // Increased duration for more detailed message
      });
    }
    setIsUpdatingRole(null);
  };

  const getAvatarFallback = (displayName?: string | null, email?: string | null) => {
    if (displayName) return displayName.substring(0, 2).toUpperCase();
    if (email) return email.substring(0, 2).toUpperCase();
    return '??';
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg font-semibold">Loading Users...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-headline text-primary">User Management</h1>
          </div>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">All Users</CardTitle>
            <CardDescription className="font-body">View and manage user roles in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-10">
                <Users className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-xl font-semibold text-muted-foreground">No users found.</p>
                <p className="text-sm text-muted-foreground">New users will appear here after they sign in for the first time.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Avatar</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.uid} className="hover:bg-muted/50">
                      <TableCell>
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                          <AvatarFallback>{getAvatarFallback(user.displayName, user.email)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium font-body">{user.displayName || 'N/A'}</TableCell>
                      <TableCell className="font-body text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> : <ShieldOff className="mr-1.5 h-3.5 w-3.5" />}
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {/* Prevent static admin from changing its own (non-existent) role or demoting itself from UI */}
                        {user.uid === 'admin-static-id' ? (
                            <Badge variant="outline">Static Admin</Badge>
                        ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isUpdatingRole === user.uid || (user.uid === currentUser?.uid && user.role === 'admin' && currentUser?.uid !== 'admin-static-id')}
                              className={user.role === 'admin' ? "hover:bg-destructive/10 hover:border-destructive hover:text-destructive" : "hover:bg-primary/10 hover:border-primary hover:text-primary"}
                            >
                              {isUpdatingRole === user.uid ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : user.role === 'admin' ? (
                                <ShieldAlert className="mr-2 h-4 w-4" />
                              ) : (
                                <ShieldCheck className="mr-2 h-4 w-4" />
                              )}
                              {user.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to change the role of <strong>{user.displayName || user.email}</strong> to <strong>{user.role === 'admin' ? 'User' : 'Admin'}</strong>?
                                {user.uid === currentUser?.uid && user.role === 'admin' && currentUser?.uid !== 'admin-static-id' && (
                                  <p className="mt-2 text-destructive font-semibold">Warning: You are about to change your own role!</p>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={isUpdatingRole === user.uid}>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRoleChange(user.uid, user.role)}
                                className={user.role === 'admin' ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-primary text-primary-foreground hover:bg-primary/90"}
                                disabled={isUpdatingRole === user.uid}
                              >
                                {isUpdatingRole === user.uid ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Confirm
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
