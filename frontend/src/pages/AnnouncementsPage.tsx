import { useCallback, useMemo } from 'react';

import type { Announcement } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { useCan } from '../hooks/useCan';
import { useResource } from '../hooks/useResource';
import { ROLE_LABEL } from '../auth/roles';
import { Badge } from '../components/ui/Badge';
import { PageHeader, SectionCard } from '../components/ui/Card';
import { EmptyState, ErrorState, SkeletonCards } from '../components/ui/States';

export function AnnouncementsPage() {
  const { client, accessToken, user } = useAuth();
  const { can } = useCan();

  const loader = useCallback((token: string) => client.listAnnouncements(token), [client]);
  const { data, error, loading, reload } = useResource(loader, accessToken);

  const announcements = useMemo(
    () =>
      [...(data ?? [])].sort((left, right) => {
        if (left.pinned !== right.pinned) {
          return left.pinned ? -1 : 1;
        }
        return left.publishedOn < right.publishedOn ? 1 : -1;
      }),
    [data],
  );

  const canManage = can('announcement.manage');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Company-wide notices published by HR and Administration, filtered to your role."
        actions={
          canManage ? (
            <Badge tone="primary">You can publish announcements</Badge>
          ) : null
        }
      />

      <SectionCard title="Notice board" description="Pinned notices appear first.">
        {loading ? (
          <SkeletonCards count={3} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : announcements.length === 0 ? (
          <EmptyState
            title="No announcements"
            description="There is nothing published for your role right now."
            icon="megaphone"
          />
        ) : (
          <ul className="space-y-4">
            {announcements.map((announcement: Announcement) => (
              <li
                key={announcement.id}
                className={`rounded-card border p-4 transition-colors duration-200 ${
                  announcement.pinned ? 'border-primary bg-primary-soft/50' : 'border-border bg-card'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="min-w-0 font-heading text-base font-semibold text-foreground">
                    {announcement.title}
                  </h2>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    {announcement.pinned ? <Badge tone="primary">Pinned</Badge> : null}
                    <Badge tone="neutral">
                      {announcement.audience.map((role) => ROLE_LABEL[role]).join(', ')}
                    </Badge>
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Published {announcement.publishedOn}</p>
                <p className="mt-2 text-sm text-foreground">{announcement.body}</p>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {user ? (
        <p className="text-xs text-muted-foreground">
          Showing notices addressed to {ROLE_LABEL[user.role]}. Other role-specific notices stay hidden.
        </p>
      ) : null}
    </div>
  );
}
