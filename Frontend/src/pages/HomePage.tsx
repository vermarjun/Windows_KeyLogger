import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User, Mail, Calendar, Shield } from 'lucide-react';

export const HomePage = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {user?.username}!
            </h2>
            <p className="text-muted-foreground">
              Here's your dashboard overview
            </p>
          </div>

          {/* User Profile Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <User className="mr-2 h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-foreground">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="text-foreground">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="text-foreground capitalize">{user?.role}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className={`${user?.isActive ? 'text-green-500' : 'text-red-500'}`}>
                      {user?.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:bg-accent/50 transition-all duration-200 cursor-pointer group">
              <CardHeader>
                <CardTitle className="text-foreground group-hover:text-primary transition-colors">
                  Analytics
                </CardTitle>
                <CardDescription>
                  View your activity metrics
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:bg-accent/50 transition-all duration-200 cursor-pointer group">
              <CardHeader>
                <CardTitle className="text-foreground group-hover:text-primary transition-colors">
                  Settings
                </CardTitle>
                <CardDescription>
                  Manage your account settings
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:bg-accent/50 transition-all duration-200 cursor-pointer group">
              <CardHeader>
                <CardTitle className="text-foreground group-hover:text-primary transition-colors">
                  Support
                </CardTitle>
                <CardDescription>
                  Get help and contact support
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}; 