import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, Users, Activity } from "lucide-react";
import AdminLayout from "../layout"; // Assuming this layout checks auth

export default function AdminDashboardPage() {
  // Data would be fetched here in a real application
  const summaryData = [
    { title: "Total Revenue", value: "$1,250.75", icon: DollarSign, change: "+5.2%" },
    { title: "Total Orders", value: "152", icon: Package, change: "+12" },
    { title: "New Customers", value: "35", icon: Users, change: "+3" },
    { title: "Pending Shipments", value: "12", icon: Activity, change: "-1" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 py-6">
        <h1 className="text-3xl font-headline text-primary">Admin Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {summaryData.map((item) => (
            <Card key={item.title} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium font-body">{item.title}</CardTitle>
                <item.icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-headline">{item.value}</div>
                <p className="text-xs text-muted-foreground pt-1">{item.change} from last month</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline">Recent Activity</CardTitle>
                    <CardDescription className="font-body">Overview of recent store events.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        <li className="text-sm text-muted-foreground">New order #1024 placed by user@example.com.</li>
                        <li className="text-sm text-muted-foreground">Inventory updated for 'Cosmic Cat' sticker.</li>
                        <li className="text-sm text-muted-foreground">User 'JaneD' registered.</li>
                    </ul>
                </CardContent>
            </Card>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline">Quick Links</CardTitle>
                     <CardDescription className="font-body">Common admin tasks.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <button className="p-4 border rounded-lg hover:bg-muted transition-colors text-sm">Manage Products</button>
                    <button className="p-4 border rounded-lg hover:bg-muted transition-colors text-sm">View Orders</button>
                    <button className="p-4 border rounded-lg hover:bg-muted transition-colors text-sm">User Management</button>
                    <button className="p-4 border rounded-lg hover:bg-muted transition-colors text-sm">Store Settings</button>
                </CardContent>
            </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
