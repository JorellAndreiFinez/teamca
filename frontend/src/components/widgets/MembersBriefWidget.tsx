import type { User } from '../../types/user';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

type MembersBriefWidgetProps = {
  title: string;
  members: User[];
  isLoading?: boolean;
};

export default function MembersBriefWidget({ title, members, isLoading = false }: MembersBriefWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-sm text-slate-500">Loading members...</p> : null}

        {!isLoading && members.length === 0 ? (
          <p className="text-sm text-slate-500">No members available.</p>
        ) : null}

        {!isLoading && members.length > 0 ? (
          <ul className="space-y-2">
            {members.slice(0, 6).map((member) => (
              <li key={member.user_id} className="rounded-md border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-900">
                  {member.first_name} {member.last_name}
                </p>
                <p className="text-xs text-slate-500">
                  {member.departments?.[0]?.department_role ?? 'Unassigned'} • {member.global_role}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}