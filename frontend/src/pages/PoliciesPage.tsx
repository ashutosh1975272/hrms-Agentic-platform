import { useCallback, useMemo, useState } from 'react';

import { ROLE_LABEL } from '../auth/roles';
import { useAuth } from '../auth/AuthContext';
import { useResource } from '../hooks/useResource';
import { useCan } from '../hooks/useCan';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageHeader, SectionCard } from '../components/ui/Card';
import { SelectField, TextField } from '../components/ui/Field';
import { Icon } from '../components/ui/Icon';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';

export function PoliciesPage() {
  const { client, accessToken, user } = useAuth();
  const { can } = useCan();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const listLoader = useCallback((token: string) => client.listPolicies(token), [client]);
  const list = useResource(listLoader, accessToken);

  const activeId = selectedId ?? list.data?.[0]?.id ?? null;
  const readerLoader = useCallback(
    (token: string) => (activeId ? client.getPolicy(token, activeId) : Promise.resolve(null)),
    [client, activeId],
  );
  const reader = useResource(readerLoader, accessToken);

  const categories = useMemo(
    () => Array.from(new Set((list.data ?? []).map((policy) => policy.category))).sort(),
    [list.data],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (list.data ?? []).filter((policy) => {
      const matchesCategory = category.length === 0 || policy.category === category;
      const matchesTerm =
        term.length === 0 ||
        policy.title.toLowerCase().includes(term) ||
        policy.summary.toLowerCase().includes(term);
      return matchesCategory && matchesTerm;
    });
  }, [list.data, search, category]);

  const canManage = can('policy.manage');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Policies"
        description="Employee handbooks, leave, attendance, conduct and security policies. Every document is versioned."
        actions={
          canManage ? (
            <Button variant="secondary" icon="shield" disabled>
              Manage documents
            </Button>
          ) : null
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <SectionCard title="Policy library" description="Select a document to read it.">
          <div className="space-y-4">
            <TextField
              label="Search policies"
              name="policySearch"
              type="search"
              inputMode="search"
              value={search}
              onChange={setSearch}
              placeholder="Work from home, leave, conduct…"
            />
            <SelectField
              label="Category"
              name="policyCategory"
              value={category}
              onChange={setCategory}
              options={categories.map((value) => ({ value, label: value }))}
              placeholder="All categories"
            />
          </div>

          <div className="mt-4">
            {list.loading ? (
              <div className="space-y-3" role="status" aria-live="polite">
                <span className="sr-only">Loading policies…</span>
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="space-y-2 rounded-control border border-border p-3">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            ) : list.error ? (
              <ErrorState message={list.error} onRetry={list.reload} />
            ) : filtered.length === 0 ? (
              <EmptyState
                title="No policies match"
                description="Try a different search term or clear the category filter."
                icon="book"
                action={
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearch('');
                      setCategory('');
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <ul className="space-y-2">
                {filtered.map((policy) => {
                  const isActive = policy.id === activeId;
                  return (
                    <li key={policy.id}>
                      <button
                        type="button"
                        aria-current={isActive ? 'true' : undefined}
                        onClick={() => setSelectedId(policy.id)}
                        className={`flex min-h-11 w-full cursor-pointer items-start gap-2.5 rounded-control border p-3 text-left transition-[background-color,border-color] duration-200 ${
                          isActive
                            ? 'border-primary bg-primary-soft'
                            : 'border-border bg-card hover:border-primary-soft hover:bg-muted/60'
                        }`}
                      >
                        <Icon name="file-text" size={18} className="mt-0.5 text-primary" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-foreground">{policy.title}</span>
                          <span className="block text-xs text-muted-foreground">{policy.summary}</span>
                          <span className="mt-1 flex flex-wrap items-center gap-1.5">
                            <Badge tone="neutral">{policy.category}</Badge>
                            <Badge tone="info">v{policy.version}</Badge>
                            <span className="text-xs text-muted-foreground">Updated {policy.updatedOn}</span>
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Reader" description="Read-only view of the selected policy.">
          {reader.loading ? (
            <div className="space-y-3" role="status" aria-live="polite">
              <span className="sr-only">Loading policy…</span>
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          ) : reader.error ? (
            <ErrorState message={reader.error} onRetry={reader.reload} />
          ) : reader.data ? (
            <article className="space-y-5">
              <header>
                <h2 className="font-heading text-xl font-semibold text-foreground">{reader.data.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{reader.data.summary}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge tone="primary">{reader.data.category}</Badge>
                  <Badge tone="info">Version {reader.data.version}</Badge>
                  <span className="text-xs text-muted-foreground">Updated {reader.data.updatedOn}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Visible to:{' '}
                  {reader.data.audience.map((role) => ROLE_LABEL[role]).join(', ')}
                </p>
              </header>

              {reader.data.sections.map((section) => (
                <section key={section.id}>
                  <h3 className="font-heading text-base font-semibold text-foreground">{section.heading}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground">{section.body}</p>
                </section>
              ))}

              <p className="rounded-control bg-muted p-3 text-xs text-muted-foreground">
                Questions about this policy? Ask the AI assistant, which answers only from the published
                documents and cites the source.
              </p>
            </article>
          ) : (
            <EmptyState
              title="Select a policy"
              description="Choose a document from the library to read it here."
              icon="book"
            />
          )}
        </SectionCard>
      </div>

      {user ? (
        <p className="text-xs text-muted-foreground">
          You are signed in as {user.fullName} ({ROLE_LABEL[user.role]}); documents are filtered to your
          audience.
        </p>
      ) : null}
    </div>
  );
}
