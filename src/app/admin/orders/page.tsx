import AdminLayout from "../layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PackageSearch, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import type { Order } from '@/types'; // Assuming Order type is defined

// Mock order data
const MOCK_ORDERS: Order[] = [
  { id: "ORD001", userId: "user123", totalAmount: 25.99, shippingAddress: { name: "Jane Doe", street: "123 Main St", city: "Anytown", state: "CA", zip: "90210", country: "USA" }, orderDate: new Date().toISOString(), status: "processing", items: [] },
  { id: "ORD002", userId: "user456", totalAmount: 12.50, shippingAddress: { name: "John Smith", street: "456 Oak Ave", city: "Otherville", state: "NY", zip: "10001", country: "USA" }, orderDate: new Date(Date.now() - 86400000).toISOString(), status: "shipped", items: [] },
  { id: "ORD003", userId: "user789", totalAmount: 45.00, shippingAddress: { name: "Alice Brown", street: "789 Pine Rd", city: "Smalltown", state: "TX", zip: "75001", country: "USA" }, orderDate: new Date(Date.now() - 172800000).toISOString(), status: "delivered", items: [] },
];


export default function AdminOrdersPage() {
  const orders = MOCK_ORDERS; // Replace with actual data fetching

  const getStatusBadgeVariant = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'outline';
      case 'processing': return 'secondary';
      case 'shipped': return 'default'; // Using primary color for shipped
      case 'delivered': return 'default'; // Green variant would be good here if available
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };


  return (
    <AdminLayout>
      <div className="space-y-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-headline text-primary">Order Management</h1>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" /> Filter Orders
          </Button>
        </div>

        {orders.length > 0 ? (
        <Card className="shadow-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium font-body">{order.id}</TableCell>
                  <TableCell className="font-body">{order.shippingAddress.name} ({order.userId.substring(0,7)}...)</TableCell>
                  <TableCell className="font-body text-muted-foreground">{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                  <TableCell className="font-body">${order.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize">
                        {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="hover:text-primary">View Details</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <PackageSearch className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-xl font-semibold text-muted-foreground font-headline">No orders found.</p>
                <p className="text-muted-foreground font-body">When customers place orders, they will appear here.</p>
            </div>
        )}

      </div>
    </AdminLayout>
  );
}
