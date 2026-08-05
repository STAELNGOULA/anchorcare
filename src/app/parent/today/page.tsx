import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ParentTodayPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <header>
        <h1 className="font-display text-3xl">Today</h1>
        <p className="text-muted-foreground">Your children&apos;s daily updates</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>No reports yet</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          When a program publishes a daily report, it will appear here and via SMS.
        </CardContent>
      </Card>
    </div>
  );
}
