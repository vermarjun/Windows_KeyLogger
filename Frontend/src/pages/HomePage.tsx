import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { VictimsPage } from './VictimsPage';
import { VictimDashboard } from './VictimDashboard';
import { VictimLogsPage } from './VictimLogsPage';

export const HomePage = () => {
  const { toast } = useToast();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    // Check if user was redirected from OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const driveAdded = urlParams.get('driveAdded');
    const error = urlParams.get('error');
    
    if (driveAdded === 'true') {
      setShowSuccessMessage(true);
      setMessageType('success');
      toast({
        title: "Success!",
        description: "Drive has been successfully added to your account.",
      });
      
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
    } else if (driveAdded === 'false' && error) {
      setShowSuccessMessage(true);
      setMessageType('error');
      toast({
        title: "Error",
        description: `Failed to add drive: ${error}`,
        variant: "destructive"
      });
      
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Hide error message after 5 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {showSuccessMessage && (
          <div className="max-w-2xl mx-auto mb-8">
            <Card className={`${
              messageType === 'success' 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}>
              <CardHeader>
                <CardTitle className={`${
                  messageType === 'success' ? 'text-green-800' : 'text-red-800'
                } flex items-center`}>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  {messageType === 'success' ? 'Drive Added Successfully!' : 'Failed to Add Drive'}
                </CardTitle>
                <CardDescription className={
                  messageType === 'success' ? 'text-green-700' : 'text-red-700'
                }>
                  {messageType === 'success' 
                    ? 'Your Google Drive has been connected and is ready to store client logs.'
                    : 'There was an error connecting your Google Drive. Please try again.'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className={`${
                  messageType === 'success' ? 'text-green-700' : 'text-red-700'
                } text-sm`}>
                  {messageType === 'success' 
                    ? 'The drive will be used as cold storage for client logs. You can manage your drives using the "Drives" dropdown in the navigation bar.'
                    : 'Please check your internet connection and try again. If the problem persists, contact support.'
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Sub-routing for HomePage */}
        <Routes>
          <Route path="/" element={<VictimsPage />} />
          <Route path="/:clientId" element={<VictimDashboard />} />
          <Route path="/:clientId/:date" element={<VictimLogsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}; 