import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <header>
        <h1 className="font-display text-3xl">Platform admin</h1>
        <p className="text-muted-foreground">Consult queue, doctors, moderation</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Incident consult queue</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No pending consults.
        </CardContent>
      </Card>
    </div>
  );
}
