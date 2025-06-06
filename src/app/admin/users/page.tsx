
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
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);
  const { toast } = useToast();
  const { currentUser, getIdToken, isAdmin } = useAuth();

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
    
    if (userId === currentUser?.uid && newRole === 'user' && currentUser?.role === 'admin' && currentUser.uid !== 'admin-static-id') {
      toast({
        title: "Action Denied",
        description: "You cannot revoke your own admin status.",
        variant: "destructive",
      });
      return;
    }

    if (currentUser?.uid === 'admin-static-id') {
      toast({
        title: "Operation Not Permitted",
        description: "The static admin (admin/admin) cannot change user roles. This action requires a dynamic admin (Google authenticated with 'role: admin').",
        variant: "destructive",
        duration: 15000,
      });
      return;
    }

    setIsUpdatingRole(userId);
    const idToken = await getIdToken();
    if (!idToken) {
        toast({ title: "Authentication Error", description: "Could not get authentication token. Please log in again.", variant: "destructive", duration: 7000 });
        setIsUpdatingRole(null);
        return;
    }

    const result = await updateUserRole(idToken, userId, newRole);
    if (result === true) {
      toast({
        title: "Role Updated",
        description: `User role changed to ${newRole}.`,
      });
      await fetchUsers(); 
    } else {
      let detailedDescription = typeof result === 'string' ? result : "Could not update user role. Ensure you are a dynamic admin and your service account for server actions is correctly configured.";
      
      if (typeof result === 'string' && result.includes("DYNAMIC ADMIN PERMISSION DENIED")) {
         detailedDescription = result; // Use the detailed message from the service
      } else if (typeof result === 'string' && result.includes("Server Action Error: User is not authorized to perform this admin operation")) {
        detailedDescription = result + "\n\n" +
          `TROUBLESHOOTING CHECKLIST for '${currentUser?.email}':\n` +
          `1. **VERIFY YOUR ADMIN ROLE IN FIRESTORE:**\n` +
          `   - Go to Firebase Console > Firestore Database > 'users' collection.\n` +
          `   - Find document for UID: '${currentUser?.uid}'.\n` +
          `   - **Ensure this document has field 'role' with *exact string value "admin"* (lowercase, no spaces).** This is CRITICAL.\n` +
          `2. **FIREBASE ADMIN SDK INITIALIZATION:**\n` +
          `   - Ensure 'FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON' env variable is correctly set in your .env file with your service account key.\n` +
          `   - Check server startup logs for 'Firebase Admin SDK initialized successfully' or any errors from 'src/firebase/adminConfig.ts'. Restart server after .env changes.\n` +
          `3. **ID TOKEN VALIDITY:** If you recently changed roles, try logging out and back in to refresh your ID token.\n` +
          `4. **FIRESTORE RULES (If Admin SDK error):** While Admin SDK usually bypasses rules, ensure your general Firestore setup is sound. Primarily focus on points 1-3 for this error.`;
      }


      toast({
        title: "Error Updating Role",
        description: detailedDescription,
        variant: "destructive",
        duration: 25000, 
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
            <CardDescription className="font-body">View and manage user roles. Role changes require a dynamic admin (Google authenticated user with 'role: "admin"' in Firestore) and correctly configured Firebase Admin SDK with service account credentials for server actions.</CardDescription>
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
                        {user.uid === 'admin-static-id' ? (
                            <Badge variant="outline">Static Admin</Badge>
                        ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isUpdatingRole === user.uid || (user.uid === currentUser?.uid && user.role === 'admin' && currentUser?.uid !== 'admin-static-id') || currentUser?.uid === 'admin-static-id' || !isAdmin}
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
                                {user.uid === currentUser?.uid && user.role === 'admin' && (
                                  <p className="mt-2 text-destructive font-semibold">Warning: You are about to change your own role to User! You will lose admin privileges.</p>
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
