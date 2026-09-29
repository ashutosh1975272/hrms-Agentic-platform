import { mockSeedEmployees } from '../api/mockAdapter';
import type { Employee, LeaveBalance, Role } from '../api/types';
import type {
  AgentCitation,
  AgentClient,
  AgentConfirmation,
  AgentConfirmationInput,
  AgentEmit,
  AgentEvent,
  AgentIdentity,
  AgentPending,
  AgentToolCall,
  AgentTurnInput,
  CreateEmployeePending,
  ToolCallStatus,
} from './types';

/**
 * Mock agent adapter.
 *
 * TASK-07 (backend agent API) is not merged yet, so the UI is built against the
 * planned contract and replays the PROJECT.md §17 acceptance scenarios locally:
 *
 *  17.1 policy question      -> RAG retrieval + grounded answer + citations
 *  17.2 leave balance query  -> structured database query
 *  17.3 HR creates employee  -> follow-up questions, then confirmation (§14)
 *  17.4 unauthorized request -> permission denied, tool never called (§13)
 */

const KNOWN_DESIGNATIONS = [
  'Senior Software Engineer',
  'Software Engineer',
  'QA Engineer',
  'Data Analyst',
  'Product Manager',
  'HR Business Partner',
  'Financial Analyst',
  'Account Executive',
  'System Administrator',
];

const LEAVE_BALANCE: LeaveBalance[] = [
  { leaveType: 'Casual', total: 12, used: 4, remaining: 8, pending: 0 },
  { leaveType: 'Sick', total: 10, used: 2, remaining: 8, pending: 0 },
  { leaveType: 'Earned', total: 18, used: 9, remaining: 9, pending: 2 },
  { leaveType: 'Work From Home', total: 24, used: 11, remaining: 13, pending: 0 },
];

const PENDING_LEAVES = [
  { employeeName: 'Priya Singh', leaveType: 'Earned', from: '2026-08-03', to: '2026-08-07' },
  { employeeName: 'Dev Kapoor', leaveType: 'Sick', from: '2026-07-30', to: '2026-07-30' },
  { employeeName: 'Sana Rao', leaveType: 'Casual', from: '2026-08-11', to: '2026-08-12' },
];

const DEPARTMENT_HEADCOUNT = [
  { department: 'Engineering', headcount: 3 },
  { department: 'Finance', headcount: 1 },
  { department: 'Sales', headcount: 1 },
  { department: 'Human Resources', headcount: 1 },
  { department: 'Administration', headcount: 1 },
];

const WFH_CITATIONS: AgentCitation[] = [
  {
    id: 'pol-wfh-3',
    title: 'Work From Home Policy 2026 — Section 3',
    source: 'Policy library / HR-POL-014',
    excerpt: 'Employees may work remotely for a maximum of two days per calendar week.',
  },
  {
    id: 'pol-handbook-9',
    title: 'Employee Handbook v4 — Working arrangements',
    source: 'Policy library / HB-2026-004',
    excerpt: 'Manager approval is required before each remote day and core hours must be covered.',
  },
];

const LEAVE_CITATIONS: AgentCitation[] = [
  {
    id: 'pol-leave-2',
    title: 'Leave Policy 2026 — Entitlement',
    source: 'Policy library / HR-POL-002',
    excerpt: 'Casual and sick credits refresh on 1 January each year.',
  },
];

interface ScriptStep {
  tool: string;
  label: string;
  result?: string;
  settleAs?: ToolCallStatus;
}

interface TurnPlan {
  steps: ScriptStep[];
  text: string;
  citations?: AgentCitation[];
  suggestions?: string[];
  confirmation?: AgentConfirmation;
  pending?: AgentPending;
  error?: { message: string; retryable: boolean };
}

const PREAMBLE: ScriptStep[] = [
  { tool: 'SESSION_VERIFY', label: 'Verifying your session…', result: 'Authenticated session' },
  { tool: 'INTENT_CLASSIFY', label: 'Classifying the request…', result: 'Intent resolved' },
  { tool: 'PERMISSION_CHECK', label: 'Checking permissions…', result: 'Role verified' },
];

export interface MockAgentOptions {
  /** Delay between streamed steps and text chunks. Tests use 0. */
  delayMs?: number;
}

function normalise(text: string): string {
  return text.trim().toLowerCase();
}

function includesAny(text: string, needles: readonly string[]): boolean {
  return needles.some((needle) => text.includes(needle));
}

function listTable(headers: string[], rows: string[][]): string {
  const head = `| ${headers.join(' | ')} |`;
  const rule = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((row) => `| ${row.join(' | ')} |`).join('\n');
  return `${head}\n${rule}\n${body}`;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error('Aborted'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function assertNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new Error('Aborted');
  }
}

function chunkText(text: string, size = 6): string[] {
  const words = text.split(' ');
  const chunks: string[] = [];
  for (let index = 0; index < words.length; index += size) {
    chunks.push(words.slice(index, index + size).join(' '));
  }
  return chunks;
}

function extractEmail(text: string): string | null {
  const match = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  return match ? match[0] : null;
}

function extractDesignation(text: string): string | null {
  const lower = normalise(text);
  for (const designation of KNOWN_DESIGNATIONS) {
    if (lower.includes(designation.toLowerCase())) {
      return designation;
    }
  }
  const labelled = text.match(/(?:designation|title)\s*(?:is|:)?\s*([A-Za-z][A-Za-z /-]{2,40})/i);
  return labelled ? labelled[1].trim().replace(/\s+/g, ' ') : null;
}

function extractPersonName(text: string): string {
  const named = text.match(/\b([A-Z][a-z]+ [A-Z][a-z]+)\b/);
  if (named) {
    return named[1];
  }
  const after = text.match(/(?:add|create|hire|remove|delete|for)\s+(?:a\s+new\s+)?employee\s+([A-Za-z]+)/i);
  return after ? after[1] : 'the new employee';
}

function extractDepartment(text: string): string {
  const departments = [
    'Engineering',
    'Human Resources',
    'Finance',
    'Sales',
    'Administration',
    'Operations',
  ];
  const lower = normalise(text);
  for (const department of departments) {
    if (lower.includes(department.toLowerCase()) || lower.includes(`hr department`)) {
      return department === 'Human Resources' && lower.includes('hr department') ? 'Human Resources' : department;
    }
  }
  return 'Engineering';
}

function employeeRows(department: string): Employee[] {
  return mockSeedEmployees.filter(
    (employee) => employee.department.toLowerCase() === department.toLowerCase(),
  );
}

function deniedPlan(action: string, reason: string, allowedText: string): TurnPlan {
  return {
    steps: [
      ...PREAMBLE.slice(0, 2),
      {
        tool: 'PERMISSION_CHECK',
        label: 'Checking permissions…',
        result: `Denied for ${action}`,
        settleAs: 'denied',
      },
    ],
    text: [
      `**Permission denied.** ${reason}`,
      '',
      'I did not run the tool — authorization is checked before any HRMS data is touched, and the attempt is written to the audit log.',
      '',
      `What you can do instead: ${allowedText}`,
    ].join('\n'),
    suggestions: ['What can I do with my account?', 'Show me the HR policies'],
  };
}

function policyPlan(): TurnPlan {
  return {
    steps: [
      ...PREAMBLE,
      {
        tool: 'POLICY_SEARCH',
        label: 'Searching policies…',
        result: '2 relevant chunks retrieved',
      },
      { tool: 'ANSWER_GENERATE', label: 'Composing a grounded answer…', result: 'Grounded on 2 chunks' },
    ],
    text: [
      '### Work-from-home policy',
      '',
      'You can work from home for **up to two days per calendar week**. The limit is per week, not per month, and unused days do not roll over.',
      '',
      listTable(
        ['Rule', 'Detail'],
        [
          ['Weekly cap', '2 remote days'],
          ['Approval', 'Manager approval before each remote day'],
          ['Core hours', '10:00 to 16:00 must be covered'],
          ['Equipment', 'Company laptop and monitor provided'],
          ['Beyond the cap', 'Special leave or WFH credit approval by HR'],
        ],
      ),
      '',
      '> This answer is grounded in the policy library. Ask about maternity, code of conduct, benefits or travel policy to read those documents instead.',
    ].join('\n'),
    citations: WFH_CITATIONS,
    suggestions: ['How many leaves do I have left?', 'Show all employees in the Engineering department', 'What is the code of conduct?'],
  };
}

function leaveBalancePlan(identity: AgentIdentity): TurnPlan {
  return {
    steps: [
      ...PREAMBLE,
      { tool: 'IDENTITY_RESOLVE', label: 'Identifying your employee record…', result: identity.fullName },
      { tool: 'LEAVE_BALANCE_READ', label: 'Reading leave balances…', result: '4 leave types' },
    ],
    text: [
      `Here is your current leave balance, ${identity.fullName}.`,
      '',
      listTable(
        ['Leave type', 'Total', 'Used', 'Remaining', 'Pending'],
        LEAVE_BALANCE.map((entry) => [
          entry.leaveType,
          String(entry.total),
          String(entry.used),
          String(entry.remaining),
          String(entry.pending),
        ]),
      ),
      '',
      '**Earned leave** is the tightest balance: 2 days are still pending approval. I can apply for leave or show the pending requests.',
    ].join('\n'),
    citations: LEAVE_CITATIONS,
    suggestions: ['Apply for one day of casual leave next Monday', 'Show my pending leave requests', 'What is the work-from-home policy?'],
  };
}

function employeeDirectoryPlan(department: string): TurnPlan {
  const rows = employeeRows(department);
  return {
    steps: [
      ...PREAMBLE,
      { tool: 'EMPLOYEE_SEARCH', label: 'Querying the employee directory…', result: `${rows.length} records` },
    ],
    text: [
      `### ${department} employees`,
      '',
      rows.length > 0
        ? listTable(
            ['Employee ID', 'Name', 'Designation', 'Status', 'Location'],
            rows.map((row) => [
              row.employeeId,
              row.fullName,
              row.designation,
              row.status === 'on_leave' ? 'On leave' : 'Active',
              row.workLocation,
            ]),
          )
        : `No employees are recorded in ${department} yet.`,
      '',
      'Ask me to add a new employee and I will collect the missing fields before creating anything.',
    ].join('\n'),
    suggestions: ['Add a new employee named Rahul Kumar to the Engineering department', 'Show the department headcount'],
  };
}

function createEmployeeFollowUpPlan(
  identity: AgentIdentity,
  name: string,
  department: string,
): TurnPlan {
  const slug = normalise(name).replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '');
  return {
    steps: [...PREAMBLE, { tool: 'FIELD_EXTRACT', label: 'Collecting missing details…', result: '2 fields missing' }],
    text: [
      `I can create **${name}** in **${department}**, ${identity.fullName}. Two required fields are still missing:`,
      '',
      '1. Work email address',
      '2. Designation',
      '',
      'Reply with both, for example: `' + `${slug}@agentichrms.test` + ', designation Software Engineer' + '`',
      '',
      'I will not create the record until you approve a summary of exactly what will be saved.',
    ].join('\n'),
    suggestions: [
      `${slug}@agentichrms.test, designation Software Engineer`,
      `${slug}@agentichrms.test, designation Senior Software Engineer`,
    ],
    pending: { kind: 'create_employee', name, department, email: null, designation: null },
  };
}

function createEmployeeConfirmationPlan(pending: CreateEmployeePending): TurnPlan {
  return {
    steps: [
      { tool: 'PERMISSION_CHECK', label: 'Re-checking permissions…', result: 'CREATE_EMPLOYEE allowed' },
      { tool: 'VALIDATE_INPUT', label: 'Validating the new record…', result: 'All required fields present' },
    ],
    text: 'Everything is ready. Review the summary below before I save anything.',
    confirmation: {
      id: 'confirm-create-employee',
      action: 'CREATE_EMPLOYEE',
      title: 'Create employee record',
      summary: `Add ${pending.name} to ${pending.department}.`,
      impact: [
        `Employee: ${pending.name}`,
        `Department: ${pending.department}`,
        `Email: ${pending.email ?? 'not provided'}`,
        `Designation: ${pending.designation ?? 'not provided'}`,
        'Default employment type: Full time, status Active',
        'An audit log entry is written for this action',
      ],
      risk: 'high',
    },
  };
}

function deleteEmployeePlan(name: string): TurnPlan {
  const target = mockSeedEmployees.find(
    (employee) => normalise(employee.fullName).includes(normalise(name)),
  );
  return {
    steps: [
      { tool: 'PERMISSION_CHECK', label: 'Re-checking permissions…', result: 'DELETE_EMPLOYEE allowed' },
      { tool: 'EMPLOYEE_LOOKUP', label: 'Locating the record…', result: target ? target.employeeId : 'EMP-9999' },
    ],
    text: 'This deletes a permanent employee record. Review the impact before continuing.',
    confirmation: {
      id: 'confirm-delete-employee',
      action: 'DELETE_EMPLOYEE',
      title: 'Delete employee record',
      summary: target
        ? `Permanently remove ${target.fullName} (${target.employeeId}) from the HRMS.`
        : `Permanently remove ${name} from the HRMS.`,
      impact: target
        ? [
            `Employee: ${target.fullName} (${target.employeeId})`,
            `Department: ${target.department}`,
            'Attendance and leave history stays archived but becomes unlinked',
            'This cannot be undone from the chat',
            'An audit log entry is written for this action',
          ]
        : [`Employee: ${name}`, 'This cannot be undone from the chat'],
      risk: 'high',
    },
  };
}

function applyLeavePlan(): TurnPlan {
  return {
    steps: [
      { tool: 'PERMISSION_CHECK', label: 'Re-checking permissions…', result: 'LEAVE_APPLY allowed' },
      { tool: 'LEAVE_VALIDATE', label: 'Validating the request…', result: 'Casual balance sufficient' },
    ],
    text: 'Here is the request I am about to submit for approval.',
    confirmation: {
      id: 'confirm-apply-leave',
      action: 'LEAVE_APPLY',
      title: 'Apply for leave',
      summary: 'Casual leave, 1 day, Monday 10 August 2026.',
      impact: [
        'Leave type: Casual (8 days remaining)',
        'Dates: 2026-08-10 to 2026-08-10',
        'Approver: Meera Iyer (HR)',
        'Your balance drops to 7 after approval',
      ],
      risk: 'medium',
    },
  };
}

function pendingLeavesPlan(): TurnPlan {
  return {
    steps: [
      ...PREAMBLE,
      { tool: 'LEAVE_PENDING_READ', label: 'Reading pending requests…', result: '3 requests' },
    ],
    text: [
      '### Pending leave requests',
      '',
      listTable(
        ['Employee', 'Leave type', 'From', 'To'],
        PENDING_LEAVES.map((entry) => [entry.employeeName, entry.leaveType, entry.from, entry.to]),
      ),
      '',
      'Say **approve** with a name and I will prepare a confirmation for that request.',
    ].join('\n'),
    suggestions: [
      'Approve Priya Singh leave',
      'Show all employees in the Engineering department',
      'How many leaves do I have left?',
    ],
  };
}

function leaveApprovalPlan(entry: (typeof PENDING_LEAVES)[number]): TurnPlan {
  return {
    steps: [
      { tool: 'PERMISSION_CHECK', label: 'Re-checking permissions…', result: 'LEAVE_APPROVE allowed' },
      { tool: 'LEAVE_LOOKUP', label: 'Loading the request…', result: entry.employeeName },
    ],
    text: 'Approving a request changes the employee balance, so I need your confirmation first.',
    confirmation: {
      id: `confirm-approve-${normalise(entry.employeeName).replace(/[^a-z]+/g, '-')}`,
      action: 'LEAVE_APPROVE',
      title: 'Approve leave request',
      summary: `${entry.employeeName} — ${entry.leaveType} leave, ${entry.from} to ${entry.to}.`,
      impact: [
        `Employee: ${entry.employeeName}`,
        `Leave type: ${entry.leaveType}`,
        `Dates: ${entry.from} to ${entry.to}`,
        'Leave balance is debited once approved',
        'The employee is notified and an audit log entry is written',
      ],
      risk: 'medium',
    },
    pending: {
      kind: 'leave_approval',
      employeeName: entry.employeeName,
      leaveType: entry.leaveType,
      from: entry.from,
      to: entry.to,
    },
  };
}

function attendancePlan(identity: AgentIdentity): TurnPlan {
  return {
    steps: [
      ...PREAMBLE,
      { tool: 'IDENTITY_RESOLVE', label: 'Identifying your employee record…', result: identity.fullName },
      { tool: 'ATTENDANCE_STATUS_READ', label: 'Reading today’s attendance…', result: 'Checked in at 09:12' },
    ],
    text: [
      `You are marked **present** today, ${identity.fullName}.`,
      '',
      listTable(
        ['Field', 'Value'],
        [
          ['Check in', '09:12'],
          ['Check out', 'Not marked yet'],
          ['Work hours', 'In progress'],
          ['Month to date', '18 present, 1 absent, 2 on leave'],
        ],
      ),
    ].join('\n'),
    suggestions: ['How many leaves do I have left?', 'Show my upcoming holidays'],
  };
}

function holidaysPlan(): TurnPlan {
  return {
    steps: [...PREAMBLE, { tool: 'HOLIDAY_READ', label: 'Reading the holiday calendar…', result: '3 holidays' }],
    text: [
      '### Upcoming holidays',
      '',
      listTable(
        ['Holiday', 'Date'],
        [
          ['Gandhi Jayanti', '2026-10-02'],
          ['Deepavali', '2026-11-08'],
          ['Company foundation day', '2026-12-01'],
        ],
      ),
    ].join('\n'),
    suggestions: ['What is the work-from-home policy?', 'How many leaves do I have left?'],
  };
}

function departmentPlan(): TurnPlan {
  return {
    steps: [...PREAMBLE, { tool: 'DEPARTMENT_READ', label: 'Reading departments…', result: '5 departments' }],
    text: [
      '### Departments',
      '',
      listTable(
        ['Department', 'Headcount'],
        DEPARTMENT_HEADCOUNT.map((entry) => [entry.department, String(entry.headcount)]),
      ),
    ].join('\n'),
    suggestions: ['Show all employees in the Engineering department', 'What is the work-from-home policy?'],
  };
}

function profilePlan(identity: AgentIdentity): TurnPlan {
  return {
    steps: [...PREAMBLE, { tool: 'PROFILE_READ', label: 'Reading your profile…', result: 'Self record only' }],
    text: [
      '### Your profile',
      '',
      listTable(
        ['Field', 'Value'],
        [
          ['Name', identity.fullName],
          ['Role', identity.role === 'hr' ? 'HR' : identity.role === 'admin' ? 'Admin' : 'Employee'],
          ['Employee ID', identity.userId.replace('usr-', 'EMP-').toUpperCase()],
          ['Access', 'You can only read your own record as an employee'],
        ],
      ),
    ].join('\n'),
    suggestions: ['How many leaves do I have left?', 'What is the work-from-home policy?'],
  };
}

function helpPlan(identity: AgentIdentity): TurnPlan {
  const managerTools =
    identity.role === 'employee'
      ? 'For employee administration I can only read your own record, so those tools are denied.'
      : 'You can also create, update and delete employee records, and approve leave requests.';
  return {
    steps: PREAMBLE,
    text: [
      'I answer HR questions with the tools your role is allowed to use, and I ground policy answers in the knowledge base.',
      '',
      '**Try one of these:**',
      '',
      '- "What is the work-from-home policy?" — knowledge base answer with sources',
      '- "How many leaves do I have left?" — live balance from the HRMS database',
      '- "Show all employees in the Engineering department" — directory query',
      '- "Add a new employee named Rahul Kumar to the Engineering department" — collect details, then confirm before saving',
      '',
      managerTools,
    ].join('\n'),
    suggestions: [
      'What is the work-from-home policy?',
      'How many leaves do I have left?',
      'Show all employees in the Engineering department',
      'Show my pending leave requests',
    ],
  };
}

function isSimulatedFailure(text: string): boolean {
  const lower = normalise(text);
  return (
    includesAny(lower, ['simulate', 'trigger', 'demo']) && includesAny(lower, ['error', 'failure', 'fail'])
  );
}

function errorPlan(): TurnPlan {
  return {
    steps: [{ tool: 'SERVICE_CALL', label: 'Contacting the agent service…' }],
    text: '',
    error: {
      message: 'The agent service did not respond. Your message was not sent and nothing was changed.',
      retryable: true,
    },
  };
}

function canCreateEmployee(role: Role): boolean {
  return role === 'hr' || role === 'admin';
}

function canManageEmployees(role: Role): boolean {
  return role === 'hr' || role === 'admin';
}

function planPendingTurn(
  pending: NonNullable<AgentPending>,
  input: AgentTurnInput,
): TurnPlan | null {
  if (pending.kind === 'create_employee') {
    const email = extractEmail(input.text);
    const designation = extractDesignation(input.text);
    const merged = {
      kind: 'create_employee' as const,
      name: pending.name,
      department: pending.department,
      email: email ?? pending.email,
      designation: designation ?? pending.designation,
    };
    if (merged.email && merged.designation) {
      return createEmployeeConfirmationPlan(merged);
    }
    const missing: string[] = [];
    if (!merged.email) {
      missing.push('work email address');
    }
    if (!merged.designation) {
      missing.push('designation');
    }
    return {
      steps: [
        { tool: 'FIELD_EXTRACT', label: 'Collecting missing details…', result: `${missing.length} field(s) missing` },
      ],
      text: [
        `Still needed for **${merged.name}**: ${missing.join(' and ')}.`,
        '',
        merged.email ? `Email captured: ${merged.email}` : '',
        merged.designation ? `Designation captured: ${merged.designation}` : '',
      ]
        .filter((line) => line.length > 0)
        .join('\n'),
      suggestions: merged.email
        ? ['designation Software Engineer']
        : [`${normalise(merged.name).replace(/[^a-z0-9]+/g, '.')}@agentichrms.test`],
      pending: merged,
    };
  }

  if (pending.kind === 'leave_approval') {
    const name = extractPersonName(input.text) || pending.employeeName;
    const entry =
      PENDING_LEAVES.find((candidate) => normalise(candidate.employeeName).includes(normalise(name))) ??
      PENDING_LEAVES.find((candidate) =>
        normalise(candidate.employeeName).includes(normalise(extractPersonName(input.text))),
      );
    return leaveApprovalPlan(entry ?? PENDING_LEAVES[0]);
  }

  return null;
}

function planTurn(input: AgentTurnInput): TurnPlan {
  const text = normalise(input.text);
  const role = input.identity.role;

  if (input.pending) {
    const pendingPlan = planPendingTurn(input.pending, input);
    if (pendingPlan) {
      return pendingPlan;
    }
  }

  const wantsDelete = includesAny(text, ['delete', 'remove', 'fire']) && includesAny(text, ['employee', 'record', 'rahul', 'priya', 'sana', 'dev']);
  if (wantsDelete) {
    const name = extractPersonName(input.text);
    if (!canManageEmployees(role)) {
      return deniedPlan(
        'DELETE_EMPLOYEE',
        `Your ${role} role cannot delete employee records. The request for **${name}** was stopped at the permission layer.`,
        'ask HR to raise the request, or read the employee record and its policies.',
      );
    }
    return deleteEmployeePlan(name);
  }

  const wantsCreate =
    includesAny(text, ['add ', 'create', 'new employee', 'onboard', 'hire', 'add a new']) &&
    includesAny(text, ['employee', 'rahul', 'priya', 'sana', 'dev', 'meera']);
  if (wantsCreate) {
    const name = extractPersonName(input.text);
    const department = extractDepartment(input.text);
    if (!canCreateEmployee(role)) {
      return deniedPlan(
        'CREATE_EMPLOYEE',
        `Your ${role} role cannot create employee records. The request to add **${name}** was stopped at the permission layer.`,
        'ask HR to add the employee, or ask me about your own profile and policies.',
      );
    }
    return createEmployeeFollowUpPlan(input.identity, name, department);
  }

  const wantsApproval = includesAny(text, ['approve', 'reject', 'sanction']);
  if (wantsApproval && includesAny(text, ['leave', 'request', 'priya', 'dev', 'sana', 'it', 'his', 'her', 'this'])) {
    if (!canManageEmployees(role)) {
      return deniedPlan(
        'LEAVE_APPROVE',
        'Approving or rejecting leave is restricted to HR and Admin. Your request was stopped at the permission layer.',
        'check your own leave balance, or ask HR about the status of your request.',
      );
    }
    const name = extractPersonName(input.text);
    const entry = PENDING_LEAVES.find((candidate) =>
      normalise(candidate.employeeName).includes(normalise(name)),
    );
    if (entry) {
      return leaveApprovalPlan(entry);
    }
    return pendingLeavesPlan();
  }

  const wantsPending = includesAny(text, ['pending leave', 'leave request', 'pending request', 'pending approval']);
  if (wantsPending && !includesAny(text, ['my own', 'mine'])) {
    if (!canManageEmployees(role)) {
      return deniedPlan(
        'LEAVE_PENDING_READ',
        'The full pending leave queue is limited to HR and Admin. Your request was stopped at the permission layer.',
        'ask me for your own leave balance instead.',
      );
    }
    return pendingLeavesPlan();
  }

  const wantsApply = includesAny(text, ['apply', 'request leave', 'book leave', 'take leave']);
  if (wantsApply && includesAny(text, ['leave', 'day', 'days', 'casual', 'sick', 'earned', 'vacation'])) {
    return applyLeavePlan();
  }

  const wantsDirectory =
    includesAny(text, ['show', 'list', 'who', 'all employees', 'everyone', 'headcount']) &&
    includesAny(text, ['employee', 'people', 'staff', 'engineering', 'finance', 'sales', 'hr', 'department']);
  if (wantsDirectory) {
    const department = extractDepartment(input.text);
    if (!canManageEmployees(role)) {
      return deniedPlan(
        'EMPLOYEE_SEARCH',
        'The employee directory is limited to HR and Admin. Your request was stopped at the permission layer.',
        'open your own profile, or ask me about policies and your leave balance.',
      );
    }
    if (includesAny(text, ['headcount', 'how many', 'count'])) {
      return departmentPlan();
    }
    return employeeDirectoryPlan(department);
  }

  const wantsPolicy = includesAny(text, [
    'policy',
    'policies',
    'wfh',
    'work from home',
    'work-from-home',
    'remote',
    'handbook',
    'maternity',
    'paternity',
    'code of conduct',
    'benefit',
    'travel',
    'faq',
    'guideline',
    'reimbursement',
    'notice period',
    'probation',
    'pf',
  ]);
  if (wantsPolicy) {
    return policyPlan();
  }

  const wantsLeaveBalance = includesAny(text, ['leave', 'leaves', 'balance', 'pto', 'vacation']);
  if (wantsLeaveBalance && includesAny(text, ['how many', 'balance', 'left', 'remaining', 'available', 'do i have'])) {
    return leaveBalancePlan(input.identity);
  }

  if (includesAny(text, ['attendance', 'check in', 'check-in', 'check out', 'present today', 'absent', 'mark me'])) {
    return attendancePlan(input.identity);
  }

  if (includesAny(text, ['holiday', 'holidays', 'calendar'])) {
    return holidaysPlan();
  }

  if (includesAny(text, ['my profile', 'about me', 'my details', 'who am i', 'my record'])) {
    return profilePlan(input.identity);
  }

  if (includesAny(text, ['department', 'departments', 'designation', 'designations'])) {
    if (!canManageEmployees(role)) {
      return deniedPlan(
        'DEPARTMENT_READ',
        'Organisation structure data is limited to HR and Admin. Your request was stopped at the permission layer.',
        'ask me about your own profile or the HR policies.',
      );
    }
    return departmentPlan();
  }

  return helpPlan(input.identity);
}

async function runPlan(
  plan: TurnPlan,
  emit: AgentEmit,
  delayMs: number,
  signal?: AbortSignal,
): Promise<void> {
  emit({ type: 'turn_started' });
  const emitEvent = (event: AgentEvent) => {
    assertNotAborted(signal);
    emit(event);
  };

  for (const step of plan.steps) {
    const call: AgentToolCall = { id: step.tool, name: step.tool, label: step.label, status: 'running' };
    emitEvent({ type: 'tool', call });
    await sleep(delayMs, signal);
    const status = step.settleAs ?? 'succeeded';
    emitEvent({ type: 'tool_settled', id: step.tool, status, ...(step.result ? { detail: step.result } : {}) });
    if (status === 'denied') {
      break;
    }
  }

  if (plan.citations && plan.citations.length > 0) {
    emitEvent({ type: 'citations', citations: plan.citations });
  }

  for (const chunk of chunkText(plan.text)) {
    await sleep(delayMs, signal);
    emitEvent({ type: 'delta', text: chunk.length > 0 ? `${chunk} ` : '' });
  }

  if (plan.confirmation) {
    emitEvent({ type: 'confirmation', confirmation: plan.confirmation });
  }

  if (plan.suggestions && plan.suggestions.length > 0) {
    emitEvent({ type: 'suggestions', suggestions: plan.suggestions });
  }

  if (plan.error) {
    emitEvent({ type: 'error', message: plan.error.message, retryable: plan.error.retryable });
    return;
  }

  emitEvent({ type: 'done', pending: plan.pending ?? null });
}

function confirmationOutcomePlan(
  confirmation: AgentConfirmation,
  decision: 'approved' | 'denied',
  identity: AgentIdentity,
): TurnPlan {
  if (decision === 'denied') {
    return {
      steps: [],
      text: [
        `**Cancelled.** Nothing was changed for ${confirmation.title.toLowerCase()}, and no tool ran.`,
        '',
        'Ask for something else whenever you are ready.',
      ].join('\n'),
      suggestions: ['What can I do with my account?', 'Show my pending leave requests'],
    };
  }

  const audit = 'Audit log: this action is recorded with your user id, role, target record and result.';

  if (confirmation.action === 'CREATE_EMPLOYEE') {
    return {
      steps: [
        { tool: 'PERMISSION_CHECK', label: 'Checking permissions…', result: 'CREATE_EMPLOYEE allowed' },
        { tool: 'EMPLOYEE_CREATE', label: 'Creating the employee record…', result: 'EMP-1042' },
        { tool: 'AUDIT_WRITE', label: 'Writing the audit log…', result: 'audit-8891' },
      ],
      text: [
        `**Employee created.** The new record is saved and visible in the employee directory.`,
        '',
        listTable(
          ['Field', 'Value'],
          [
            ['Employee ID', 'EMP-1042'],
            ['Status', 'Active'],
            ['Created by', `${identity.fullName} (${identity.role})`],
          ],
        ),
        '',
        audit,
      ].join('\n'),
      suggestions: ['Show all employees in the Engineering department', 'What is the work-from-home policy?'],
    };
  }

  if (confirmation.action === 'DELETE_EMPLOYEE') {
    return {
      steps: [
        { tool: 'PERMISSION_CHECK', label: 'Checking permissions…', result: 'DELETE_EMPLOYEE allowed' },
        { tool: 'EMPLOYEE_DELETE', label: 'Deleting the employee record…', result: 'Deleted' },
        { tool: 'AUDIT_WRITE', label: 'Writing the audit log…', result: 'audit-8892' },
      ],
      text: [
        '**Record deleted.** The employee record is removed from the HRMS and the deletion is recorded in the audit log.',
        '',
        audit,
      ].join('\n'),
      suggestions: ['Show all employees in the Engineering department', 'What is the work-from-home policy?'],
    };
  }

  if (confirmation.action === 'LEAVE_APPROVE') {
    return {
      steps: [
        { tool: 'PERMISSION_CHECK', label: 'Checking permissions…', result: 'LEAVE_APPROVE allowed' },
        { tool: 'LEAVE_APPROVE', label: 'Approving the request…', result: 'Approved' },
        { tool: 'AUDIT_WRITE', label: 'Writing the audit log…', result: 'audit-8893' },
      ],
      text: [
        `**Leave approved** for ${confirmation.summary.split('—')[0].trim()}. The balance is updated and the employee has been notified.`,
        '',
        audit,
      ].join('\n'),
      suggestions: ['Show my pending leave requests', 'Show all employees in the Engineering department'],
    };
  }

  return {
    steps: [
      { tool: 'PERMISSION_CHECK', label: 'Checking permissions…', result: `${confirmation.action} allowed` },
      { tool: confirmation.action, label: 'Submitting the request…', result: 'Submitted' },
      { tool: 'AUDIT_WRITE', label: 'Writing the audit log…', result: 'audit-8894' },
    ],
    text: [
      '**Leave request submitted.** It is now waiting for HR approval, and the balance updates once it is approved.',
      '',
      audit,
    ].join('\n'),
    suggestions: ['How many leaves do I have left?', 'What is the work-from-home policy?'],
  };
}

export function createMockAgentClient(options: MockAgentOptions = {}): AgentClient {
  const delayMs = options.delayMs ?? 260;
  let simulatedFailures = 0;

  return {
    kind: 'mock',

    suggestTitle(text: string): string {
      const cleaned = text.trim().replace(/\s+/g, ' ');
      if (cleaned.length <= 44) {
        return cleaned;
      }
      return `${cleaned.slice(0, 43).trimEnd()}…`;
    },

    async sendTurn(input, emit, signal) {
      // The first simulated failure fails on purpose so the retry state is
      // demonstrable; retrying the same request succeeds.
      if (isSimulatedFailure(input.text) && simulatedFailures === 0) {
        simulatedFailures += 1;
        await runPlan(errorPlan(), emit, delayMs, signal);
        return;
      }
      await runPlan(planTurn(input), emit, delayMs, signal);
    },

    async resolveConfirmation(input: AgentConfirmationInput, emit, signal) {
      emit({ type: 'turn_started' });
      emit({ type: 'confirmation_settled', id: input.confirmation.id, decision: input.decision });
      await runPlan(confirmationOutcomePlan(input.confirmation, input.decision, input.identity), emit, delayMs, signal);
    },
  };
}
