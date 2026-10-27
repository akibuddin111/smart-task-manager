# AI Usage Report
**Project:** Smart Task & Project Management System  
**Assessment:** Bright Mind Ltd. Technical Recruitment Assessment

## 1. Tools Used

- **ChatGPT:** Technical guidance, code review, debugging, security considerations, and documentation support.
- **Visual Studio Code:** Editing and managing application source files.
- **Node.js, npm, and Vite:** Running the application, checking code quality with ESLint, and building the frontend.
- **PostgreSQL and pgAdmin:** Database creation, schema management, and database verification.
- **Postman:** Testing backend API requests and authentication flows.
- **Git and GitHub:** Version control, meaningful commits, and repository management.

## 2. Three Important Prompts

### 1. Initial Project Planning Prompt

I provided ChatGPT with the Bright Mind Ltd. assessment requirements, mandatory technology stack (React.js, Vite, Node.js, Express.js, PostgreSQL, and `pg`), required features, security expectations, five-day deadline, and development rules. I instructed it to act as a senior full-stack developer and mentor, inspect existing files before making changes, guide implementation one milestone at a time, and provide testing instructions after each milestone.

**Purpose:** Establish the architecture, implementation priorities, security requirements, and incremental development workflow.

**Original prompt:** [Read the complete initial project instruction prompt](docs/INITIAL_AI_PROMPT.md)

### 2. Overdue-Task Synchronization Prompt

“Suggest to the easiest way to syncronise overdue tasks.”

**Purpose:** Find a straightforward way to synchronize overdue-task information across the dashboard, metrics, and notification system.

### 3. Frontend Debugging and Quality-Check Prompt

I shared actual ESLint errors and Vite production-build output with ChatGPT to diagnose React Hooks lint issues and an authentication-context module-resolution problem.

**Purpose:** Resolve frontend quality-check failures while preserving existing functionality and keeping ESLint rules enabled.


## 3. One Problem Solved with AI

**Problem: Preventing unauthorized access in a multi-user task management system**

As the application evolved from basic project and task CRUD into a multi-user system, protecting resources became a critical requirement. A valid login alone should not grant every user access to every project or task. The application needed role-based permissions and project membership rules.

I used ChatGPT to help design server-side authorization checks, project membership management, and Admin/Team Member permissions. The implementation included role restrictions and membership-based access controls, rather than relying only on hiding frontend buttons.

**Verification and outcome:** I tested authentication and authorization through Postman, including protected endpoint access and regression checks. I reported that the authentication and authorization regression tests passed. This process reinforced an important security principle: authorization must be enforced by the backend, not just the user interface.

## 4. One Incorrect or Incomplete AI Suggestion

**Problem: A frontend refactor passed linting but broke the production build**

During a React lint cleanup, ChatGPT guided me through separating the authentication context and `useAuth` hook to address Fast Refresh lint errors. The initial refactor introduced incorrect imports and a filename collision between `AuthContext.jsx` and `authContext.js`. Although ESLint passed, Vite's production build failed with missing-export errors.

**How I corrected it:** Instead of assuming that a clean lint result meant the code was correct, I inspected the actual files and build errors. I renamed the context-only module to `authContextValue.js`, corrected the imports, and reran both quality checks. ESLint and the production build then passed, and I manually verified login, session restoration after refresh, protected-page access, logout, and login again.

**Lesson learned:** AI-generated code is a useful starting point, not proof of correctness. I verified the suggestion against the real codebase, build output, and application behavior before accepting the change.

## 5. Verification and Correction

The issue was investigated using PowerShell file inspection and the actual Vite build error. The context module was renamed to `authContextValue.js`, and the imports were corrected. ESLint and the production build then both passed. The application was also manually checked for login, session restoration after refresh, navigation to protected pages, logout, and logging in again; all five checks passed according to the developer's test report.

**Conclusion:** AI was used as a development assistant, while implementation decisions were checked against the source code, terminal output, build results, and manual application tests.
