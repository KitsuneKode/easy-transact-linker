
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Event {
  id: number;
  event: string;
  timestamp: string;
  data: any;
}

interface RecentEventsProps {
  events: Event[];
}

const RecentEvents = ({ events }: RecentEventsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Events</CardTitle>
        <CardDescription>Last 10 tracked events</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {events.map((event) => (
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
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RecentEvents;
