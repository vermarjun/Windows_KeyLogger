import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogOut, User, Settings, Lock, ChevronDown, HardDrive, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Drive {
  _id: string;
  email: string;
  isFull: boolean;
  tokenInfo: {
    access_token: string;
    refresh_token: string;
    scope: string;
  };
  isExpired: boolean;
  expiresAt: string | null;
  status: 'Active' | 'Full' | 'Expired';
}

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showDrivesDropdown, setShowDrivesDropdown] = useState(false);
  const [drives, setDrives] = useState<Drive[]>([]);
  const [isLoadingDrives, setIsLoadingDrives] = useState(false);
  const [isAddingDrive, setIsAddingDrive] = useState(false);
  
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const drivesDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (drivesDropdownRef.current && !drivesDropdownRef.current.contains(event.target as Node)) {
        setShowDrivesDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const handleEditProfile = () => {
    setShowProfileDropdown(false);
    navigate('/profile');
  };

  const handleChangePassword = () => {
    setShowProfileDropdown(false);
    navigate('/change-password');
  };

  const fetchDrives = async () => {
    if (drives.length > 0) return; // Already loaded
    
    setIsLoadingDrives(true);
    try {
      const response = await fetch('http://localhost:8000/api/drive/drives', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDrives(data);
      } else {
        console.error('Failed to fetch drives:', response.status, response.statusText);
        toast({
          title: "Error",
          description: "Failed to fetch drives. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to fetch drives:', error);
      toast({
        title: "Error",
        description: "Failed to fetch drives. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingDrives(false);
    }
  };

  const handleDrivesClick = () => {
    if (!showDrivesDropdown) {
      fetchDrives();
    }
    setShowDrivesDropdown(!showDrivesDropdown);
  };

  const handleAddDrive = async () => {
    const confirmed = window.confirm(
      'This drive will be used as cold storage to store client logs. Do you want to proceed?'
    );
    
    if (!confirmed) return;
    
    setIsAddingDrive(true);
    try {
      const response = await fetch('http://localhost:8000/api/drive/google-oauth-url', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Redirect to Google OAuth
        window.location.href = data.url;
      } else {
        throw new Error('Failed to get OAuth URL');
      }
    } catch (error) {
      console.error('Failed to get OAuth URL:', error);
      toast({
        title: "Error",
        description: "Failed to start OAuth process. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAddingDrive(false);
    }
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        
        <div className="flex items-center space-x-3">
          {/* Profile Icon */}
          <div className="relative" ref={profileDropdownRef}>
            <Button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              variant="outline"
              size="sm"
              className="rounded-full w-10 h-10 p-0"
            >
              <User className="h-4 w-4" />
            </Button>
            
            {showProfileDropdown && (
              <Card className="absolute right-0 top-12 w-48 z-50 shadow-lg">
                <CardContent className="p-2">
                  <div className="space-y-1">
                    <Button
                      onClick={handleEditProfile}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                    <Button
                      onClick={handleChangePassword}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Admin Button - only show if user is admin */}
          {user?.role === 'admin' && (
            <Button
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Admin
            </Button>
          )}

          {/* Add Drive Button - only show if user is admin */}
          {user?.role === 'admin' && (
            <Button
              onClick={handleAddDrive}
              variant="outline"
              size="sm"
              disabled={isAddingDrive}
              className="flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>{isAddingDrive ? 'Adding...' : 'Add Drive'}</span>
            </Button>
          )}

          {/* Drives Dropdown - only show if user is admin */}
          {user?.role === 'admin' && (
            <div className="relative" ref={drivesDropdownRef}>
              <Button
                onClick={handleDrivesClick}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <HardDrive className="h-4 w-4" />
                <span>Drives</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
              
              {showDrivesDropdown && (
                <Card className="absolute right-0 top-12 w-80 z-50 shadow-lg max-h-96 overflow-y-auto">
                  <CardContent className="p-2">
                    {isLoadingDrives ? (
                      <div className="text-center py-2 text-sm text-muted-foreground">
                        Loading drives...
                      </div>
                    ) : drives.length > 0 ? (
                      <div className="space-y-1">
                        {drives.map((drive) => (
                          <div key={drive._id} className="w-full">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-left p-3"
                              onClick={() => {
                                setShowDrivesDropdown(false);
                                // Handle drive selection
                                console.log('Selected drive:', drive);
                              }}
                            >
                              <HardDrive className="mr-2 h-4 w-4 flex-shrink-0" />
                              <div className="flex flex-col items-start w-full min-w-0">
                                <div className="flex items-center justify-between w-full mb-1">
                                  <span className="font-medium truncate text-sm">{drive.email}</span>
                                  <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2 ${
                                    drive.status === 'Active' ? 'bg-green-100 text-green-800' :
                                    drive.status === 'Full' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {drive.status}
                                  </span>
                                </div>
                                
                                {/* Token Information */}
                                <div className="text-xs text-muted-foreground space-y-1 w-full">
                                  <div className="flex justify-between">
                                    <span>Access Token:</span>
                                    <span className={`${
                                      drive.tokenInfo?.access_token === 'Present' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {drive.tokenInfo?.access_token || 'Unknown'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Refresh Token:</span>
                                    <span className={`${
                                      drive.tokenInfo?.refresh_token === 'Present' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {drive.tokenInfo?.refresh_token || 'Unknown'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Scope:</span>
                                    <span className="truncate ml-2" title={drive.tokenInfo?.scope}>
                                      {drive.tokenInfo?.scope || 'Unknown'}
                                    </span>
                                  </div>
                                  
                                  {/* Expiration Info */}
                                  <div className="flex justify-between">
                                    <span>Expires:</span>
                                    <span className={`${
                                      drive.isExpired ? 'text-red-600' : 'text-green-600'
                                    }`}>
                                      {drive.isExpired ? 'Expired' : 
                                       drive.expiresAt ? new Date(drive.expiresAt).toLocaleDateString() :
                                       'Unknown'}
                                    </span>
                                  </div>
                                  
                                  {/* Full Status */}
                                  <div className="flex justify-between">
                                    <span>Storage:</span>
                                    <span className={`${
                                      drive.isFull ? 'text-yellow-600' : 'text-green-600'
                                    }`}>
                                      {drive.isFull ? 'Full' : 'Available'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-2 text-sm text-muted-foreground">
                        No drives available
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}; 