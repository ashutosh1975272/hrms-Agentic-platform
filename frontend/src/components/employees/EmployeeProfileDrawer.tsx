import {
  EMPLOYEE_STATUS_LABEL,
  EMPLOYMENT_TYPE_LABEL,
  type Employee,
} from '../../api/types';
import { Avatar, Badge, type BadgeTone } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { Icon } from '../ui/Icon';

const STATUS_TONE: Record<Employee['status'], BadgeTone> = {
  active: 'success',
  on_leave: 'warning',
  inactive: 'neutral',
};

function DetailList({ items }: { items: ReadonlyArray<{ label: string; value: string }> }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {item.label}
          </dt>
          <dd className="mt-0.5 text-sm break-words text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export interface EmployeeProfileDrawerProps {
  employee: Employee | null;
  onClose: () => void;
  onEdit?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
}

export function EmployeeProfileDrawer({ employee, onClose, onEdit, onDelete }: EmployeeProfileDrawerProps) {
  return (
    <Drawer
      open={employee !== null}
      title={employee ? employee.fullName : 'Employee profile'}
      description={employee ? `${employee.employeeId} · ${employee.designation}` : undefined}
      onClose={onClose}
      footer={
        employee && (onEdit || onDelete) ? (
          <>
            {onDelete ? (
              <Button variant="danger" icon="trash" onClick={() => onDelete(employee)}>
                Delete
              </Button>
            ) : null}
            {onEdit ? (
              <Button icon="pencil" onClick={() => onEdit(employee)}>
                Edit record
              </Button>
            ) : null}
          </>
        ) : undefined
      }
    >
      {employee ? (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Avatar name={employee.fullName} size="lg" />
            <div className="min-w-0">
              <p className="font-heading text-lg font-semibold text-foreground">{employee.fullName}</p>
              <p className="text-sm break-words text-muted-foreground">{employee.email}</p>
            </div>
            <Badge tone={STATUS_TONE[employee.status]} className="ml-auto">
              {EMPLOYEE_STATUS_LABEL[employee.status]}
            </Badge>
          </div>

          <section aria-label="Employment">
            <h3 className="font-heading text-sm font-semibold text-foreground">Employment</h3>
            <div className="mt-2">
              <DetailList
                items={[
                  { label: 'Employee ID', value: employee.employeeId },
                  { label: 'Department', value: employee.department },
                  { label: 'Designation', value: employee.designation },
                  { label: 'Reporting manager', value: employee.reportingManager ?? 'Not assigned' },
                  { label: 'Employment type', value: EMPLOYMENT_TYPE_LABEL[employee.employmentType] },
                  { label: 'Date of joining', value: employee.dateOfJoining },
                ]}
              />
            </div>
          </section>

          <section aria-label="Contact">
            <h3 className="font-heading text-sm font-semibold text-foreground">Contact</h3>
            <div className="mt-2">
              <DetailList
                items={[
                  { label: 'Phone', value: employee.phone },
                  { label: 'Work location', value: employee.workLocation },
                  { label: 'Address', value: employee.address.length > 0 ? employee.address : 'Not provided' },
                ]}
              />
            </div>
          </section>

          <section aria-label="Emergency contact">
            <h3 className="font-heading text-sm font-semibold text-foreground">Emergency contact</h3>
            <div className="mt-2">
              <DetailList
                items={[
                  { label: 'Name', value: employee.emergencyContact.name },
                  {
                    label: 'Relationship',
                    value: employee.emergencyContact.relationship.length > 0
                      ? employee.emergencyContact.relationship
                      : 'Not provided',
                  },
                  { label: 'Phone', value: employee.emergencyContact.phone },
                ]}
              />
            </div>
          </section>

          <p className="flex items-start gap-2 rounded-control bg-muted p-3 text-xs text-muted-foreground">
            <Icon name="info" size={16} />
            Every change to this record is written to the audit log with the previous and updated values.
          </p>
        </div>
      ) : null}
    </Drawer>
  );
}
