
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface ActivityChartProps {
  data: { hour: string; count: number }[];
  isLoading?: boolean;
}

const ActivityChart = ({ data, isLoading = false }: ActivityChartProps) => {
  // Format dates for display
  const formattedData = data.map(item => {
    try {
      // Try to parse as ISO date first
      const date = new Date(item.hour);
      
      if (!isNaN(date.getTime())) {
        return {
          ...item,
          formattedHour: format(date, "h:mm a")
        };
      }
      
      // If not an ISO date, just use the original
      return {
        ...item,
        formattedHour: item.hour
      };
    } catch (e) {
      console.error("Date parsing error:", e);
      return {
        ...item,
        formattedHour: item.hour
      };
    }
  });

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Hourly Activity</CardTitle>
        <CardDescription>Events tracked by hour of day</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center">
              <Skeleton className="h-[250px] w-full" />
            </div>
          ) : formattedData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="formattedHour" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))'
                  }}
                  formatter={(value, name) => [value, 'Events']}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <p className="text-muted-foreground">No data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityChart;
