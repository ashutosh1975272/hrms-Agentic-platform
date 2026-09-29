import { useMemo, useState } from 'react';

import {
  EMPLOYEE_STATUS_LABEL,
  EMPLOYMENT_TYPE_LABEL,
  type Employee,
  type EmployeeInput,
  type EmployeeStatus,
  type EmploymentType,
} from '../../api/types';
import { Button } from '../ui/Button';
import { SelectField, TextField } from '../ui/Field';
import { Modal } from '../ui/Modal';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()\d][\d\s\-()]{5,}$/;

const STATUS_OPTIONS = (Object.keys(EMPLOYEE_STATUS_LABEL) as EmployeeStatus[]).map((value) => ({
  value,
  label: EMPLOYEE_STATUS_LABEL[value],
}));

const EMPLOYMENT_OPTIONS = (Object.keys(EMPLOYMENT_TYPE_LABEL) as EmploymentType[]).map((value) => ({
  value,
  label: EMPLOYMENT_TYPE_LABEL[value],
}));

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  dateOfJoining: string;
  department: string;
  designation: string;
  reportingManager: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  workLocation: string;
  address: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = {
  fullName: '',
  email: '',
  phone: '',
  dateOfJoining: '',
  department: '',
  designation: '',
  reportingManager: '',
  employmentType: 'full_time',
  status: 'active',
  workLocation: '',
  address: '',
  emergencyContactName: '',
  emergencyContactRelationship: '',
  emergencyContactPhone: '',
};

function formFromEmployee(employee: Employee): FormState {
  return {
    fullName: employee.fullName,
    email: employee.email,
    phone: employee.phone,
    dateOfJoining: employee.dateOfJoining,
    department: employee.department,
    designation: employee.designation,
    reportingManager: employee.reportingManager ?? '',
    employmentType: employee.employmentType,
    status: employee.status,
    workLocation: employee.workLocation,
    address: employee.address,
    emergencyContactName: employee.emergencyContact.name,
    emergencyContactRelationship: employee.emergencyContact.relationship,
    emergencyContactPhone: employee.emergencyContact.phone,
  };
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (form.fullName.trim().length < 2) {
    errors.fullName = 'Enter the employee full name.';
  }
  if (!EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = 'Enter a valid work email address.';
  }
  if (!PHONE_PATTERN.test(form.phone.trim())) {
    errors.phone = 'Enter a reachable phone number.';
  }
  if (form.dateOfJoining.length === 0) {
    errors.dateOfJoining = 'Date of joining is required.';
  }
  if (form.department.trim().length === 0) {
    errors.department = 'Department is required.';
  }
  if (form.designation.trim().length === 0) {
    errors.designation = 'Designation is required.';
  }
  if (form.workLocation.trim().length === 0) {
    errors.workLocation = 'Work location is required.';
  }
  if (form.emergencyContactName.trim().length === 0) {
    errors.emergencyContactName = 'Emergency contact name is required.';
  }
  if (form.emergencyContactPhone.trim().length > 0 && !PHONE_PATTERN.test(form.emergencyContactPhone.trim())) {
    errors.emergencyContactPhone = 'Enter a valid phone number.';
  }
  return errors;
}

export interface EmployeeFormModalProps {
  open: boolean;
  /** Null creates a new employee; an employee edits the existing record. */
  employee: Employee | null;
  departments: readonly string[];
  designations: readonly string[];
  managers: readonly string[];
  busy?: boolean;
  serverError?: string | null;
  onClose: () => void;
  onSubmit: (input: EmployeeInput) => void;
}

export function EmployeeFormModal(props: EmployeeFormModalProps) {
  return props.open ? <EmployeeFormDialog key={props.employee?.id ?? 'new'} {...props} /> : null;
}

function EmployeeFormDialog({
  employee,
  departments,
  designations,
  managers,
  busy = false,
  serverError = null,
  onClose,
  onSubmit,
}: EmployeeFormModalProps) {
  const [form, setForm] = useState<FormState>(() =>
    employee
      ? formFromEmployee(employee)
      : { ...EMPTY_FORM, dateOfJoining: new Date().toISOString().slice(0, 10) },
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const set = <K extends keyof FormState>(key: K) => (value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const departmentOptions = useMemo(() => {
    const merged = new Set<string>(departments);
    if (form.department.length > 0) {
      merged.add(form.department);
    }
    return Array.from(merged)
      .sort((left, right) => left.localeCompare(right))
      .map((value) => ({ value, label: value }));
  }, [departments, form.department]);

  const designationOptions = useMemo(() => {
    const merged = new Set<string>(designations);
    if (form.designation.length > 0) {
      merged.add(form.designation);
    }
    return Array.from(merged)
      .sort((left, right) => left.localeCompare(right))
      .map((value) => ({ value, label: value }));
  }, [designations, form.designation]);

  const managerOptions = useMemo(
    () => managers.map((value) => ({ value, label: value })),
    [managers],
  );

  const handleSubmit = () => {
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    onSubmit({
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      dateOfJoining: form.dateOfJoining,
      department: form.department.trim(),
      designation: form.designation.trim(),
      reportingManager: form.reportingManager.trim().length > 0 ? form.reportingManager.trim() : null,
      employmentType: form.employmentType,
      status: form.status,
      workLocation: form.workLocation.trim(),
      address: form.address.trim(),
      emergencyContactName: form.emergencyContactName.trim(),
      emergencyContactRelationship: form.emergencyContactRelationship.trim(),
      emergencyContactPhone: form.emergencyContactPhone.trim(),
    });
  };

  return (
    <Modal
      open
      size="lg"
      title={employee ? 'Edit employee' : 'Add employee'}
      description={
        employee
          ? 'Update the employee record. Changes are written to the audit trail.'
          : 'Create a new employee record. Employee ID is generated automatically.'
      }
      onClose={onClose}
      dismissible={!busy}
      footer={
        <>
          <Button variant="subtle" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={busy} icon={busy ? 'refresh' : 'check'}>
            {busy ? 'Saving…' : employee ? 'Save changes' : 'Create employee'}
          </Button>
        </>
      }
    >
      {serverError ? (
        <p role="alert" className="mb-4 rounded-control border border-destructive/40 bg-destructive/10 p-3 text-sm font-medium text-destructive-strong">
          {serverError}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Full name"
          name="fullName"
          required
          value={form.fullName}
          onChange={set('fullName')}
          error={errors.fullName ?? null}
          autoComplete="name"
        />
        <TextField
          label="Work email"
          name="email"
          type="email"
          required
          value={form.email}
          onChange={set('email')}
          error={errors.email ?? null}
          autoComplete="email"
        />
        <TextField
          label="Phone"
          name="phone"
          type="tel"
          required
          value={form.phone}
          onChange={set('phone')}
          error={errors.phone ?? null}
          autoComplete="tel"
        />
        <TextField
          label="Date of joining"
          name="dateOfJoining"
          type="date"
          required
          value={form.dateOfJoining}
          onChange={set('dateOfJoining')}
          error={errors.dateOfJoining ?? null}
        />
        <SelectField
          label="Department"
          name="department"
          required
          value={form.department}
          onChange={set('department')}
          options={departmentOptions}
          placeholder="Select a department"
          error={errors.department ?? null}
        />
        <SelectField
          label="Designation"
          name="designation"
          required
          value={form.designation}
          onChange={set('designation')}
          options={designationOptions}
          placeholder="Select a designation"
          error={errors.designation ?? null}
        />
        <SelectField
          label="Reporting manager"
          name="reportingManager"
          value={form.reportingManager}
          onChange={set('reportingManager')}
          options={managerOptions}
          placeholder="No reporting manager"
          hint="Leave empty when this employee reports to nobody."
        />
        <SelectField
          label="Work location"
          name="workLocation"
          required
          value={form.workLocation}
          onChange={set('workLocation')}
          options={[...new Set([form.workLocation, 'Bengaluru HQ', 'Pune Campus', 'Mumbai Sales', 'Remote'])].filter(Boolean).map((value) => ({ value, label: value }))}
          placeholder="Select a location"
          error={errors.workLocation ?? null}
        />
        <SelectField
          label="Employment type"
          name="employmentType"
          value={form.employmentType}
          onChange={(value) => set('employmentType')(value as EmploymentType)}
          options={EMPLOYMENT_OPTIONS}
        />
        <SelectField
          label="Employment status"
          name="status"
          value={form.status}
          onChange={(value) => set('status')(value as EmployeeStatus)}
          options={STATUS_OPTIONS}
        />
        <TextField
          label="Address"
          name="address"
          value={form.address}
          onChange={set('address')}
          className="sm:col-span-2"
          autoComplete="street-address"
        />
        <TextField
          label="Emergency contact name"
          name="emergencyContactName"
          required
          value={form.emergencyContactName}
          onChange={set('emergencyContactName')}
          error={errors.emergencyContactName ?? null}
        />
        <TextField
          label="Emergency contact relationship"
          name="emergencyContactRelationship"
          value={form.emergencyContactRelationship}
          onChange={set('emergencyContactRelationship')}
          placeholder="Spouse, parent, sibling…"
        />
        <TextField
          label="Emergency contact phone"
          name="emergencyContactPhone"
          type="tel"
          value={form.emergencyContactPhone}
          onChange={set('emergencyContactPhone')}
          error={errors.emergencyContactPhone ?? null}
        />
      </div>
    </Modal>
  );
}
