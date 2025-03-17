
import React, { useState, useEffect } from 'react';
import { getAnalyticsData } from '@/lib/metakeep';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AnimatedBackground from '@/components/AnimatedBackground';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [pageVisits, setPageVisits] = useState<{ name: string; value: number }[]>([]);
  const [transactionStats, setTransactionStats] = useState<{ name: string; value: number }[]>([]);
  const [hourlyActivity, setHourlyActivity] = useState<{ hour: string; count: number }[]>([]);
  
  useEffect(() => {
    // Load analytics data
    const data = getAnalyticsData();
    setAnalytics(data);
    
    // Process analytics data
    processAnalyticsData(data);
  }, []);
  
  const processAnalyticsData = (data: any[]) => {
    // Count page visits by type
    const visitCounts: Record<string, number> = {};
    
    // Count transaction successes and failures
    const txCounts = {
      success: 0,
      error: 0,
      pending: 0,
    };
    
    // Count hourly activity
    const hourlyData: Record<string, number> = {};
    
    data.forEach(item => {
      // Page visits
      if (item.event.includes('page_visit') || item.event.includes('page_init')) {
        const eventType = item.event;
        visitCounts[eventType] = (visitCounts[eventType] || 0) + 1;
      }
      
      // Transaction stats
      if (item.event === 'transaction_success') {
        txCounts.success += 1;
      } else if (item.event === 'transaction_error') {
        txCounts.error += 1;
      } else if (item.event === 'transaction_execution_start') {
        txCounts.pending += 1;
      }
      
      // Hourly activity
      if (item.timestamp) {
        const date = new Date(item.timestamp);
        const hour = date.getHours();
        const hourKey = `${hour}:00`;
        hourlyData[hourKey] = (hourlyData[hourKey] || 0) + 1;
      }
    });
    
    // Convert to arrays for charts
    const pageVisitsArray = Object.entries(visitCounts).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value
    }));
    
    const txStatsArray = Object.entries(txCounts).map(([name, value]) => ({
      name,
      value
    }));
    
    const hourlyArray = Object.entries(hourlyData)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
    
    setPageVisits(pageVisitsArray);
    setTransactionStats(txStatsArray);
    setHourlyActivity(hourlyArray);
  };
  
  const getRecentEvents = () => {
    return analytics
      .slice(-10) // Get last 10 events
      .reverse()  // Most recent first
      .map((item, index) => ({
        id: index,
        event: item.event,
        timestamp: new Date(item.timestamp).toLocaleString(),
        data: item.data
      }));
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <AnimatedBackground />
      <Header />
      
      <main className="flex-1 container px-4 py-8 max-w-6xl">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track transaction performance and user activity
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{analytics.length}</div>
              <p className="text-muted-foreground text-sm">Total tracked events</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {transactionStats.length > 0 
                  ? Math.round((transactionStats.find(s => s.name === 'success')?.value || 0) / 
                    ((transactionStats.find(s => s.name === 'success')?.value || 0) + 
                     (transactionStats.find(s => s.name === 'error')?.value || 0)) * 100) + '%'
                  : '0%'}
              </div>
              <p className="text-muted-foreground text-sm">Transaction success rate</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Active Chains</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(
                  analytics
                    .filter(item => item.data?.chainId)
                    .map(item => item.data.chainId)
                )).map((chainId, index) => (
                  <Badge key={index} variant="outline" className="bg-primary/10">
                    Chain ID: {chainId}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="overview" className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="events">Recent Events</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="animate-slide-up">
            <Card>
              <CardHeader>
                <CardTitle>Hourly Activity</CardTitle>
                <CardDescription>Events tracked by hour of day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="transactions" className="space-y-6 animate-slide-up">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Status</CardTitle>
                <CardDescription>Success vs. error statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={transactionStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {transactionStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="events" className="animate-slide-up">
            <Card>
              <CardHeader>
                <CardTitle>Recent Events</CardTitle>
                <CardDescription>Last 10 tracked events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getRecentEvents().map((event) => (
                    <div key={event.id} className="p-3 border rounded-md">
                      <div className="flex justify-between items-start mb-1">
                        <Badge variant="outline" className="bg-primary/5">
                          {event.event.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {event.timestamp}
                        </span>
                      </div>
                      <pre className="text-xs mt-2 bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                  
                  {getRecentEvents().length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No events recorded yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>TransactLinker Analytics Dashboard</p>
      </footer>
    </div>
  );
};

export default Analytics;
