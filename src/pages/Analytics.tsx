import React, { useState, useEffect } from 'react';
import { getAnalyticsData } from '@/lib/metakeep';
import Header from '@/components/Header';
import AnimatedBackground from '@/components/AnimatedBackground';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatsCard from '@/components/analytics/StatsCard';
import ActivityChart from '@/components/analytics/ActivityChart';
import RecentEvents from '@/components/analytics/RecentEvents';

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

  const successRate = transactionStats.length > 0
    ? Math.round((transactionStats.find(s => s.name === 'success')?.value || 0) /
      ((transactionStats.find(s => s.name === 'success')?.value || 0) +
       (transactionStats.find(s => s.name === 'error')?.value || 0)) * 100)
    : 0;

  const activeChains = Array.from(new Set(
    analytics
      .filter(item => item.data?.chainId)
      .map(item => item.data.chainId)
  ));
  
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
          <StatsCard 
            title="Total Events" 
            value={analytics.length}
            description="Total tracked events"
          />
          <StatsCard 
            title="Success Rate" 
            value={`${successRate}%`}
            description="Transaction success rate"
          />
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Active Chains</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {activeChains.map((chainId, index) => (
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
          
          <TabsContent value="overview" className="space-y-6">
            <ActivityChart data={hourlyActivity} />
          </TabsContent>
          
          <TabsContent value="transactions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StatsCard 
                title="Successful Transactions" 
                value={transactionStats.find(s => s.name === 'success')?.value || 0}
              />
              <StatsCard 
                title="Failed Transactions" 
                value={transactionStats.find(s => s.name === 'error')?.value || 0}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="events">
            <RecentEvents events={getRecentEvents()} />
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
