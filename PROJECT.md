# Agentic HRMS — Project Reference (MAIN FILE)

> This is the authoritative reference for the Agentic HRMS build. Agents must treat this file as the source of truth for requirements. The build plan is in `PLAN.md`; the task queue is in `tasks/`.

## 1. Project Overview

Agentic HRMS is an AI-powered, role-based Human Resource Management System that combines traditional HRMS functionality with Agentic AI and Retrieval-Augmented Generation (RAG). The platform provides a complete web-based HRMS experience along with a conversational AI interface that allows authorized users to retrieve information and perform HR operations using natural language.

The system supports three primary roles: Admin, HR, and Employee. Each role has different permissions, dashboards, data access, and operational capabilities. The AI assistant is aware of the authenticated user's identity and role, ensuring that it follows the same authorization and permission rules as the main application.

## 2. Problem Statement

Traditional HRMS platforms require users to navigate through multiple modules, forms, and screens to perform simple operations. HR information is also commonly distributed across databases, policy documents, employee handbooks, and internal knowledge bases. This makes information retrieval and routine HR operations time-consuming.

Agentic HRMS addresses this problem by providing both a traditional dashboard and an intelligent AI interface. Users can continue using standard HRMS modules while also interacting with the system conversationally. The AI agent determines whether a request requires a database query, RAG-based document retrieval, an authorized system action, or additional information from the user.

## 3. Project Objectives

- Build a complete role-based Human Resource Management System.
- Provide Admin, HR, and Employee dashboards with different permissions.
- Manage employee information, attendance, leaves, departments, designations, and policies.
- Implement a RAG-based knowledge system for company policies and HR documentation.
- Implement an Agentic AI assistant capable of selecting tools and performing authorized actions.
- Allow authorized users to perform Create, Read, Update, and Delete operations through natural language.
- Ensure role-based access control and tool-level authorization.
- Maintain audit logs for important AI and system actions.
- Provide a secure and conversational interface for HR operations.

## 4. User Roles and Access Model

### 4.1 Admin

- Manage HR users and employee accounts.
- Create, update, and manage departments and designations.
- Configure roles and permissions.
- Manage leave types and leave policies.
- Configure holidays and organizational settings.
- View organization-wide reports and analytics.
- Manage company policies and knowledge-base documents.
- Perform authorized Create, Read, Update, and Delete operations.
- Manage system-level configuration and access control.

### 4.2 HR

- Create and manage employee records.
- Update employee information.
- Manage employee onboarding.
- View and manage attendance.
- Review, approve, or reject leave requests.
- Manage employee documents.
- Manage HR policies and announcements where permitted.
- Generate HR reports.
- Perform authorized HR operations through the dashboard or AI assistant.

### 4.3 Employee

- View personal profile.
- Update permitted personal information.
- Mark and view attendance.
- Apply for leave.
- View leave balance and leave history.
- Cancel eligible leave requests.
- View holidays and announcements.
- Access company policies and employee documents.
- Track onboarding and assigned tasks.
- Use the AI assistant for authorized personal queries and actions.

## 5. Core HRMS Modules

### 5.1 Employee Management

Employee ID, full name, email and phone, date of joining, department, designation, reporting manager, employment type and status, work location, profile info, address and emergency contact, employee documents.

### 5.2 Department and Designation Management

Authorized users manage departments and designations. Employees link to departments, designations, reporting managers, and organizational info.

### 5.3 Attendance Management

- Employee check-in and check-out.
- Daily and monthly attendance views.
- Attendance history.
- Absence and attendance tracking.
- Attendance correction by authorized users.
- Organization and department-level attendance reports.

### 5.4 Leave Management

- Apply for leave.
- View leave balance and history.
- Cancel eligible requests.
- Approve or reject leave requests.
- Configure leave types and policies.
- Track pending and approved requests.
- Leave types: Casual, Sick, Earned, Work From Home, Maternity, Paternity, organization-specific.

### 5.5 Policies and Knowledge Management

Centralized knowledge base: employee handbooks, leave/attendance/WFH policies, code of conduct, benefits, travel policies, FAQs.

### 5.6 Dashboard and Analytics

- Employee Dashboard: attendance summary, leave balance, upcoming holidays, pending requests, announcements, profile/onboarding status.
- HR Dashboard: total employees, new employees, employees on leave, pending requests, attendance statistics, departments.
- Admin Dashboard: organization-wide metrics, departments, active users, attendance/leave statistics, system activity.

## 6. Agentic AI Assistant

Understands requests, identifies operations, validates permissions, selects tools, retrieves data, executes authorized actions. Handles:

### 6.1 Information Retrieval (structured DB)

Example: "How many leaves do I have remaining?"

### 6.2 Knowledge-Based Questions (RAG)

Example: "What is the company work-from-home policy?"

### 6.3 Actions and Operations (tools)

Example: "Create a new employee in the Engineering department."

## 7. Role-Aware Agent Behavior

Request -> Authentication -> Role Identification -> Permission Validation -> Intent Understanding -> Tool/Workflow Selection -> Execute or Deny. The assistant must never bypass authorization. Example: an employee cannot delete another employee record.

## 8. Conversational CRUD Operations

- Create: "Add a new employee named Priya Singh to the HR department."
- Read: "Show all employees in the Engineering department."
- Update: "Change Rahul's designation to Senior Software Engineer."
- Delete: "Remove the temporary employee record."
- Missing info -> agent asks follow-up questions before executing.

## 9. RAG Architecture

### 9.1 Ingestion: Documents -> Upload -> Text Extraction -> Chunking -> Embeddings -> Vector Database.

### 9.2 Retrieval: Question -> Query Embedding -> Vector Similarity Search -> Relevant Chunks -> LLM with Context -> Grounded Response.

Used for policies, handbooks, guidelines, benefits, FAQs, document knowledge.

## 10. Structured Database Querying

Employee records, attendance, leave balances/requests, departments, designations, onboarding status, reports — answered from the HRMS database via tools, never RAG.

## 11. AI Tools and Capabilities

- Employee Management Tool: create/search/retrieve/update/delete (authorized).
- Attendance Tool: mark/retrieve/status/correct/report.
- Leave Management Tool: apply/balance/history/approve-reject/cancel.
- Organization Management Tool: departments/designations CRUD + retrieval.
- Policy Retrieval Tool: search policies, retrieve documents, grounded answers.
- User and Permission Management Tool (Admin): users, roles, activation, permissions.

## 12. Agentic Workflow

USER -> Authentication -> Role Identification -> Permission Check -> Master AI Agent -> {RAG Agent -> Vector DB | Database Agent -> HRMS Database | Action Agent -> HRMS APIs} -> Response Generator -> USER.

## 13. Permission and Authorization Layer

Every AI tool call passes the permission layer: Requested Tool -> Permission Check -> Allowed (Execute) or Denied (Permission Error).

| Operation | Admin | HR | Employee |
|---|---|---|---|
| View own profile | Yes | Yes | Yes |
| View all employees | Yes | Yes | No |
| Create employee | Yes | Yes | No |
| Update employee | Yes | Authorized | Limited / Own Data |
| Delete employee | Yes | Authorized | No |
| Apply for leave | Yes | Yes | Yes |
| Approve leave | Yes | Yes | No |
| View company policies | Yes | Yes | Yes |
| Manage roles and permissions | Yes | No | No |

## 14. Sensitive Action Confirmation

Destructive/sensitive operations require explicit confirmation (delete employees, critical info changes, role changes, bulk actions). Agent summarizes affected records first, then asks for confirmation.

## 15. Conversational Context and Memory

Short-term per-user conversation context for multi-step interactions (e.g. "Show pending leaves" -> "Approve Rahul's"). Scoped to the authenticated user; never leaks across sessions.

## 16. Audit Logging

Record: authenticated user, role, requested action, tool/service, affected entity, previous/updated values, status, timestamp.

## 17. Example End-to-End Scenarios (acceptance tests)

### 17.1 Employee Policy Question

"What is the work-from-home policy?" -> auth -> classify as policy question -> RAG retrieval -> grounded response.

### 17.2 Employee Leave Query

"How many leaves do I have left?" -> identify employee -> structured leave query -> leave tool -> balance -> result.

### 17.3 HR Creates an Employee

"Add Rahul Kumar in Engineering." -> auth + HR role -> CREATE_EMPLOYEE intent -> permission check -> extract info -> ask follow-ups for missing fields -> call tool -> create -> audit log -> success response.

### 17.4 Unauthorized Request

Employee: "Delete employee Rahul." -> auth -> DELETE_EMPLOYEE -> permission check -> DENY, never call the tool.

## 18. Traditional Dashboard and AI Integration

Traditional: Login -> Dashboard -> Module -> Form -> Action. Agentic: Request -> AI Agent -> Permission Check -> Tool -> Result. The AI complements, not replaces, the dashboard.

## 19. Suggested Technical Architecture

Frontend (dashboard + AI chat), Backend (REST APIs + logic), Authentication (login + RBAC), HRMS Database, Agent Orchestrator, RAG Service, Vector Database, LLM Provider, Tool Layer, Audit Service.

## 20. Security Principles

- LLM must not bypass backend authorization.
- Every tool call validates identity and permissions.
- Users access only authorized data; employee data isolated.
- Sensitive actions require confirmation.
- Input validation before DB changes.
- Audit logs for important operations.
- RAG retrieval respects document-level access where required.

## 21-22. Value and Final Description

Role-based AI-powered HRMS combining traditional modules with Agentic AI + RAG: role-specific dashboards and permissions; employee/attendance/leave/department/policy management; role-aware tools; conversational CRUD; structured querying; context; confirmations; audit logs; workflow orchestration.

## 23. Key Features Summary

Three roles; role dashboards/permissions; employee, attendance, leave, department/designation management; policy knowledge base; RAG policy QA; AI chatbot; role-aware tool calling; conversational CRUD; structured DB querying; conversation context; sensitive-action confirmation; audit logging; dashboard + AI interaction.
