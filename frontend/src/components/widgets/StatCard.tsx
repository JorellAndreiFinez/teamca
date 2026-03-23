import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';

type StatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
};

export default function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="text-xs uppercase tracking-wide">{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <CardTitle className="text-2xl">{value}</CardTitle>
        {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}