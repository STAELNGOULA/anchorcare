import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CoachProgramsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <header>
        <h1 className="font-display text-3xl">My programs</h1>
        <p className="text-muted-foreground">Record voice reports and publish updates</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>No programs assigned</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Your director will assign programs after you accept an invite.
        </CardContent>
      </Card>
    </div>
  );
}
