import { useEffect, useMemo, useState } from "react";
import { userService } from "../../services/userService";
import UserDirectory from "./UserDirectory";
import type { User } from "../../types/user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { StatCardSkeleton, WidgetSkeleton } from "../../components/ui/Skeleton";

export default function SuperAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true);
        const data = await userService.getAllUsers();
        setUsers(data);
      } catch {
        setError("Unable to load dashboard summary.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadUsers();
  }, []);

  const summary = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((user) => user.is_active).length;
    const whitelistedUsers = users.filter((user) => !user.is_active).length;
    const managementUsers = users.filter(
      (user) =>
        user.global_role === "Superadmin" || user.global_role === "Admin",
    ).length;

    return {
      totalUsers,
      activeUsers,
      whitelistedUsers,
      managementUsers,
    };
  }, [users]);

  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => <StatCardSkeleton key={index} />)
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wide">
                  Total Users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CardTitle>{summary.totalUsers}</CardTitle>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wide">
                  Active Users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CardTitle>{summary.activeUsers}</CardTitle>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wide">
                  Whitelisted
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CardTitle>{summary.whitelistedUsers}</CardTitle>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wide">
                  Management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CardTitle>{summary.managementUsers}</CardTitle>
              </CardContent>
            </Card>
          </>
        )}
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {isLoading ? <WidgetSkeleton lines={5} /> : <UserDirectory />}
    </div>
  );
}
