import { useCallback, useMemo, useState } from 'react';

import {
  EMPLOYEE_STATUS_LABEL,
  EMPLOYMENT_TYPE_LABEL,
  type Department,
  type Designation,
  type Employee,
  type EmployeeInput,
  type EmployeeStatus,
} from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { useCan } from '../hooks/useCan';
import { useResource } from '../hooks/useResource';
import { EmployeeFormModal } from '../components/employees/EmployeeFormModal';
import { EmployeeProfileDrawer } from '../components/employees/EmployeeProfileDrawer';
import { Avatar, Badge, type BadgeTone } from '../components/ui/Badge';
import { Button, IconButton } from '../components/ui/Button';
import { PageHeader, SectionCard } from '../components/ui/Card';
import { DataTable, type Column } from '../components/ui/DataTable';
import { SelectField, TextField } from '../components/ui/Field';
import { ConfirmDialog } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { useToast } from '../components/ui/toastContext';

const PAGE_SIZE = 8;

const STATUS_TONE: Record<EmployeeStatus, BadgeTone> = {
  active: 'success',
  on_leave: 'warning',
  inactive: 'neutral',
};

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All statuses' },
  ...(Object.keys(EMPLOYEE_STATUS_LABEL) as EmployeeStatus[]).map((value) => ({
    value,
    label: EMPLOYEE_STATUS_LABEL[value],
  })),
];

export function EmployeesPage() {
  const { client, accessToken, user } = useAuth();
  const { can } = useCan();
  const { notify } = useToast();

  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);

  const [profile, setProfile] = useState<Employee | null>(null);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const canCreate = can('employee.create');
  const canUpdate = can('employee.update');
  const canDelete = can('employee.delete');
  const viewAll = can('employee.view_all');

  const filters = useMemo(
    () => ({
      search: search.trim() || undefined,
      department: department || undefined,
      status: status as EmployeeStatus | 'all',
    }),
    [search, department, status],
  );

  const loader = useCallback(
    (token: string) => client.listEmployees(token, filters),
    [client, filters],
  );
  const { data, error, loading, reload } = useResource(loader, accessToken);

  const departmentsLoader = useCallback(
    (token: string) => (viewAll ? client.listDepartments(token) : Promise.resolve([] as Department[])),
    [client, viewAll],
  );
  const departments = useResource(departmentsLoader, accessToken);

  const designationsLoader = useCallback(
    (token: string) => (viewAll ? client.listDesignations(token) : Promise.resolve([] as Designation[])),
    [client, viewAll],
  );
  const designations = useResource(designationsLoader, accessToken);

  const rows = useMemo(() => data ?? [], [data]);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const departmentNames = useMemo(
    () => (departments.data ?? []).map((item) => item.name),
    [departments.data],
  );
  const designationNames = useMemo(
    () => (designations.data ?? []).map((item) => item.title),
    [designations.data],
  );
  const managerNames = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => row.reportingManager).filter((name): name is string => name !== null))),
    [rows],
  );

  const openCreate = () => {
    setEditing(null);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (employee: Employee) => {
    setProfile(null);
    setEditing(employee);
    setFormError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }
    setFormOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const handleSubmit = async (input: EmployeeInput) => {
    if (!accessToken) {
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await client.updateEmployee(accessToken, editing.id, input);
        notify({ tone: 'success', title: 'Employee updated', description: `${input.fullName} was updated.` });
      } else {
        await client.createEmployee(accessToken, input);
        notify({ tone: 'success', title: 'Employee created', description: `${input.fullName} was added.` });
      }
      setFormOpen(false);
      setEditing(null);
      reload();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'The employee could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!accessToken || !deleting) {
      return;
    }
    setDeleteBusy(true);
    try {
      await client.deleteEmployee(accessToken, deleting.id);
      notify({ tone: 'success', title: 'Employee deleted', description: `${deleting.fullName} was removed.` });
      setDeleting(null);
      setProfile(null);
      reload();
    } catch (cause) {
      notify({
        tone: 'danger',
        title: 'Delete failed',
        description: cause instanceof Error ? cause.message : 'The employee could not be deleted.',
      });
    } finally {
      setDeleteBusy(false);
    }
  };

  const columns: Array<Column<Employee>> = useMemo(
    () => [
      {
        key: 'fullName',
        header: 'Employee',
        render: (row) => (
          <div className="flex items-center gap-2.5">
            <Avatar name={row.fullName} size="sm" />
            <div className="min-w-0">
              <span className="block font-medium break-words text-foreground">{row.fullName}</span>
              <span className="block text-xs break-words text-muted-foreground">{row.employeeId}</span>
            </div>
          </div>
        ),
      },
      { key: 'department', header: 'Department', render: (row) => row.department },
      { key: 'designation', header: 'Designation', render: (row) => row.designation },
      {
        key: 'employmentType',
        header: 'Type',
        render: (row) => EMPLOYMENT_TYPE_LABEL[row.employmentType],
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => <Badge tone={STATUS_TONE[row.status]}>{EMPLOYEE_STATUS_LABEL[row.status]}</Badge>,
      },
      { key: 'workLocation', header: 'Location', render: (row) => row.workLocation },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (row) => (
          <div className="flex justify-end gap-1">
            <IconButton
              icon="eye"
              label={`View profile of ${row.fullName}`}
              size="sm"
              onClick={() => setProfile(row)}
            />
            {canUpdate ? (
              <IconButton
                icon="pencil"
                label={`Edit ${row.fullName}`}
                size="sm"
                onClick={() => openEdit(row)}
              />
            ) : null}
            {canDelete ? (
              <IconButton
                icon="trash"
                label={`Delete ${row.fullName}`}
                size="sm"
                onClick={() => setDeleting(row)}
              />
            ) : null}
          </div>
        ),
      },
    ],
    [canDelete, canUpdate],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description={
          viewAll
            ? 'Search the organisation directory, open a profile, and maintain employee records.'
            : 'Your employee record. Contact HR to request a correction to any detail.'
        }
        actions={
          canCreate ? (
            <Button icon="user-plus" onClick={openCreate}>
              Add employee
            </Button>
          ) : null
        }
      />

      {!viewAll ? (
        <p className="rounded-control border border-border bg-muted/60 p-3 text-sm text-muted-foreground">
          You can only see your own record. Viewing, editing and deleting other employees requires HR or
          Admin access.
        </p>
      ) : null}

      <SectionCard title="Directory" description={`${rows.length} record${rows.length === 1 ? '' : 's'} match your filters.`}>
        <form
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
          }}
          role="search"
          aria-label="Filter employees"
        >
          <TextField
            label="Search"
            name="search"
            type="search"
            inputMode="search"
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Name, ID, email or designation"
            hint="Matches name, employee ID, email and designation."
          />
          <SelectField
            label="Department"
            name="department"
            value={department}
            onChange={(value) => {
              setDepartment(value);
              setPage(1);
            }}
            options={departmentNames.map((value) => ({ value, label: value }))}
            placeholder="All departments"
          />
          <SelectField
            label="Status"
            name="status"
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={STATUS_OPTIONS}
          />
          <div className="flex items-end gap-2">
            <Button
              type="button"
              variant="subtle"
              icon="refresh"
              onClick={() => {
                setSearch('');
                setDepartment('');
                setStatus('all');
                setPage(1);
              }}
            >
              Reset
            </Button>
            <Button type="submit" icon="filter">
              Apply
            </Button>
          </div>
        </form>

        <div className="mt-4">
          <DataTable
            caption="Employee directory"
            columns={columns}
            rows={paged}
            rowKey={(row) => row.id}
            loading={loading}
            error={error}
            {...(error ? { onRetry: reload } : {})}
            emptyTitle="No employees match these filters"
            emptyDescription="Adjust the search, department or status filters to widen the results."
          />
        </div>

        <Pagination
          page={safePage}
          pageCount={pageCount}
          totalItems={rows.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          label="Employee directory pagination"
        />
      </SectionCard>

      {user ? (
        <p className="text-xs text-muted-foreground">
          Signed in as {user.fullName}. Destructive actions are confirmed and audited (PROJECT.md §14).
        </p>
      ) : null}

      <EmployeeProfileDrawer
        employee={profile}
        onClose={() => setProfile(null)}
        {...(canUpdate ? { onEdit: openEdit } : {})}
        {...(canDelete ? { onDelete: (employee: Employee) => setDeleting(employee) } : {})}
      />

      <EmployeeFormModal
        open={formOpen}
        employee={editing}
        departments={departmentNames}
        designations={designationNames}
        managers={managerNames}
        busy={saving}
        serverError={formError}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Delete employee record"
        destructive
        busy={deleteBusy}
        confirmLabel="Delete permanently"
        message={
          deleting ? (
            <>
              <p>
                This permanently removes <strong>{deleting.fullName}</strong> ({deleting.employeeId}) and all
                linked attendance and leave history. This action cannot be undone.
              </p>
            </>
          ) : null
        }
        onConfirm={handleDelete}
        onClose={() => {
          if (!deleteBusy) {
            setDeleting(null);
          }
        }}
      />
    </div>
  );
}
