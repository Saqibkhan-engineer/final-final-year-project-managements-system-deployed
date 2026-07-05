# FYP Portal Exhaustive API Documentation

This document provides a highly detailed, structured, and exhaustive breakdown of every single API endpoint used across the frontend application. 
Every API includes its definition file, where it is actually used/consumed in the system, its request payload, and its purpose.

---

## 1. Authentication & Global 

### 1.1. Login API (`handleLogin`)
- **Defined & Used In:** `src/components/login.jsx` (inside `handleLogin` function)
- **Description / Purpose:** Authenticates a user (Student, Supervisor, Admin, or Office). Depending on the `loginType`, it formats the student's registration number (e.g., `FA20-BSE-005`) into an email format before sending. Returns the access token and user details upon success.
- **HTTP Method:** `POST`
- **Endpoint Route:** `/api/auth/login`
- **Payload / Data Sent (JSON Body):**
  ```json
  {
    "email": "student-reg / user-email",
    "password": "user-password"
  }
  ```

---

## 2. FYP Office Dashboard 
Used by the PEC / FYP Office staff. All APIs are defined directly in the component.

### 2.1. Fetch Submitted Proposals
- **Defined & Used In:** `src/components/fypofficeDashboard.jsx` (inside `fetchSubmittedProposals` function)
- **Description / Purpose:** Fetches all student proposals that are waiting for initial PEC approval to populate the "Pending Review" list on the dashboard.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/pec/submitted/:supervisorId`
- **URL Parameters:** `supervisorId`

### 2.2. Approve Proposal
- **Defined & Used In:** `src/components/fypofficeDashboard.jsx` (inside `handleApprove` function)
- **Description / Purpose:** Approves a student's submitted project proposal. This unlocks the student's ability to browse and send requests to supervisors.
- **HTTP Method:** `PATCH`
- **Endpoint Route:** `/api/pec/approve/:id`
- **URL Parameters:** `id` (Proposal ID)
- **Payload / Data Sent (JSON Body):**
  ```json
  {
    "feedback": "Proposal approved. Proceed to supervisor selection."
  }
  ```

### 2.3. Reject Proposal
- **Defined & Used In:** `src/components/fypofficeDashboard.jsx` (inside `handleReject` function)
- **Description / Purpose:** Rejects a student's proposal. Mandatory feedback must be sent so the student knows exactly what needs fixing before they can resubmit.
- **HTTP Method:** `PATCH`
- **Endpoint Route:** `/api/pec/reject/:id`
- **URL Parameters:** `id` (Proposal ID)
- **Payload / Data Sent (JSON Body):**
  ```json
  {
    "feedback": "Detailed reason for rejection..."
  }
  ```

### 2.4. Fetch All Committees
- **Defined & Used In:** `src/components/fypofficeDashboard.jsx` (inside `fetchCommittees` function)
- **Description / Purpose:** Retrieves the list of all existing PEC committees created by the office to display them on the dashboard.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/pec/all`

### 2.5. Fetch Supervisors by Domain
- **Defined & Used In:** `src/components/fypofficeDashboard.jsx` (inside `fetchSupervisorsByDomain` function)
- **Description / Purpose:** Filters and fetches supervisors belonging to a specific domain (e.g., Web, AI). Used when the office is creating a new domain-specific committee.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/supervisor/all?domain=:domain`

### 2.6. Create PEC Committee
- **Defined & Used In:** `src/components/fypofficeDashboard.jsx` (inside `handleCreateCommittee` function)
- **Description / Purpose:** Creates a new Project Evaluation Committee (PEC) for a specific domain and assigns the selected faculty supervisors to it.
- **HTTP Method:** `POST`
- **Endpoint Route:** `/api/pec/create`
- **Payload / Data Sent (JSON Body):**
  ```json
  {
    "name": "Committee Name",
    "domain": "Domain Name",
    "supervisorIds": [1, 2, 3]
  }
  ```

---

## 3. Student Dashboard
Used by students to manage their FYP lifecycle. All APIs are defined in `StudentDashboard/api.js`.

### 3.1. Fetch Student Dashboard Data
- **Defined In:** `src/components/StudentDashboard/api.js` (`fetchStudentDashboardApi`)
- **Used In:** `src/components/StudentDashboard/index.jsx` (inside `fetchMyProposal` function)
- **Description / Purpose:** Loads the core state of the student. It returns whether the student has an active proposal, their group ID, supervisor details, and their current system phase.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/students/dashboard?studentId=:studentId`

### 3.2. Check Proposal Similarity
- **Defined In:** `src/components/StudentDashboard/api.js` (`checkSimilarityApi`)
- **Used In:** `src/components/StudentDashboard/index.jsx` (inside `handleSubmit` function)
- **Description / Purpose:** Before a student finalizes their proposal, the uploaded PDF is sent to the backend to run a plagiarism/similarity check against old FYPs in the database.
- **HTTP Method:** `POST`
- **Endpoint Route:** `/api/proposal/check-similarity`
- **Payload / Data Sent (FormData):**
  - `title`, `description`, `domain`, `studentId`, `file` (PDF File Object)

### 3.3. Enhance Proposal via AI
- **Defined In:** `src/components/StudentDashboard/api.js` (`enhanceProposalApi`)
- **Used In:** `src/components/StudentDashboard/index.jsx` (inside `handleEnhance` function)
- **Description / Purpose:** Sends the raw proposal text to the backend, which queries Google Gemini AI to grammatically fix and professionally restructure the text.
- **HTTP Method:** `POST`
- **Endpoint Route:** `/api/proposal/enhance`
- **Payload / Data Sent (JSON Body):**
  ```json
  {
    "title": "...", "description": "...", "scope": "...", "modules": "..."
  }
  ```

### 3.4. Submit Proposal to PEC
- **Defined In:** `src/components/StudentDashboard/api.js` (`submitToPecApi`)
- **Used In:** `src/components/StudentDashboard/index.jsx` (inside `handleSendToCommittee` function)
- **Description / Purpose:** Finalizes the proposal and formally submits it to the FYP Office (PEC) for review. It also groups the selected teammates together.
- **HTTP Method:** `POST`
- **Endpoint Route:** `/api/pec/submit-to-pec`
- **Payload / Data Sent (JSON Body):** Proposal Object + `memberRegNos: []`

### 3.5. Search Students
- **Defined In:** `src/components/StudentDashboard/api.js` (`searchStudentsApi`)
- **Used In:** `src/components/StudentDashboard/index.jsx` (inside `searchStudents` function)
- **Description / Purpose:** Searches the database for other students by name or reg number so the current student can invite them to form a project group.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/supervisor/students/search?name=:query`

### 3.6. Fetch Available Ideas
- **Defined In:** `src/components/StudentDashboard/api.js` (`fetchAvailableIdeasApi`)
- **Used In:** `src/components/StudentDashboard/index.jsx` (inside `fetchAvailableIdeas` function)
- **Description / Purpose:** Fetches pre-defined project ideas posted by faculty members so students can pick one if they lack an original idea.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/ideas/students/available`

### 3.7. Fetch Supervisors
- **Defined In:** `src/components/StudentDashboard/api.js` (`fetchSupervisorsApi`)
- **Used In:** `src/components/StudentDashboard/index.jsx` (inside `fetchSupervisors` function)
- **Description / Purpose:** Fetches faculty members. If a domain query is passed, it only fetches supervisors matching the student's proposal domain.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/supervisor/all?domain=:domain`

### 3.8. Send Supervisor Request
- **Defined In:** `src/components/StudentDashboard/api.js` (`sendSupervisorRequestApi`)
- **Used In:** `src/components/StudentDashboard/index.jsx` (inside `handleSelectSupervisor` function)
- **Description / Purpose:** Sends an official request to a selected faculty member asking them to be the supervisor for their approved proposal.
- **HTTP Method:** `POST`
- **Endpoint Route:** `/api/supervisor/send-supervisor-request`
- **Payload / Data Sent (JSON Body):**
  ```json
  { "studentId": 1, "proposalId": 5, "supervisorId": 10 }
  ```

### 3.9. Fetch Evaluation Phases
- **Defined In:** `src/components/StudentDashboard/api.js` (`fetchEvaluationPhasesApi`)
- **Used In:** `src/components/StudentDashboard/index.jsx` (inside `fetchPhasesAndData` useEffect)
- **Description / Purpose:** Fetches the evaluation schedule (phases) so the student sees what deliverables are due.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/evaluation/evaluation-form/:groupId`

### 3.10. Submit Document
- **Defined In:** `src/components/StudentDashboard/api.js` (`submitDocumentApi`)
- **Used In:** `src/components/StudentDashboard/index.jsx` (inside `handleDocumentSubmit` function)
- **Description / Purpose:** Uploads a required project document (like an SRS report) and a GitHub repository link for an active evaluation phase.
- **HTTP Method:** `POST`
- **Endpoint Route:** `/api/evaluation/submit-document/:groupId/:phaseId/:studentId`
- **Payload / Data Sent (FormData):** `file` (PDF File), `githubLink` (String)

### 3.11. View Uploaded Document
- **Defined In:** `src/components/StudentDashboard/api.js` (`fetchViewDocumentApi`)
- **Used In:** `src/components/StudentDashboard/index.jsx` (inside `fetchPhasesAndData` useEffect)
- **Description / Purpose:** Reloads the specific document and repo link the student has already uploaded for a phase so they can view it.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/evaluation/view-document/:groupId/:phaseId`

### 3.12. Fetch Marks
- **Defined In:** `src/components/StudentDashboard/api.js` (`fetchMarksApi`)
- **Used In:** `src/components/StudentDashboard/index.jsx` (inside `fetchPhasesAndData` useEffect)
- **Description / Purpose:** Fetches the graded marks and evaluator feedback once a phase has been assessed.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/evaluation/marks/:groupId/:phaseId`

### 3.13. Fetch My Committee
- **Defined In:** `src/components/StudentDashboard/api.js` (`fetchMyCommitteeApi`)
- **Used In:** `src/components/StudentDashboard/index.jsx` (inside `fetchMyCommittee` function)
- **Description / Purpose:** Retrieves details about the external faculty committee assigned to evaluate the student's group.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/students/my-committee/:studentId`

### 3.14. Fetch Chat Messages (Student)
- **Defined In:** `src/components/StudentDashboard/api.js` (`fetchChatMessagesApi`)
- **Used In:** `src/components/StudentDashboard/index.jsx` (inside `initChat` useEffect)
- **Description / Purpose:** Fetches the complete chat history for the student's group to populate the Chat UI.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/chat/messages/:groupId`

### 3.15. Send Chat Message (Student)
- **Defined In:** `src/components/StudentDashboard/api.js` (`sendChatMessageApi`)
- **Used In:** `src/components/StudentDashboard/index.jsx` (inside `sendStudentMessage` function)
- **Description / Purpose:** Sends a new text message to the group's chat room.
- **HTTP Method:** `POST`
- **Endpoint Route:** `/api/chat/send`
- **Payload / Data Sent (JSON Body):**
  ```json
  { "groupId": 1, "senderId": 12, "senderName": "Student Name", "senderRole": "student", "message": "Hello Sir" }
  ```

### 3.16. Real-time WebSocket Connection
- **Defined & Used In:** `src/components/StudentDashboard/index.jsx` (`getStudentSocket`)
- **Description / Purpose:** Establishes a real-time connection using Socket.io to receive instant chat messages (`receiveMessage`).
- **Endpoint:** `VITE_API_URL`
- **Emitted Event:** `joinRoom(groupId)`

---

## 4. Supervisor Dashboard
Used by faculty to supervise groups and evaluate projects. All APIs defined in `SupervisorDashboard/api.js`.

### 4.1. Check PEC Committee Status
- **Defined In:** `src/components/SupervisorDashboard/api.js` (`checkPecCommitteeStatusApi`)
- **Used In:** `src/components/SupervisorDashboard/index.jsx` (inside `handleCheckPecStatus` function)
- **Description / Purpose:** Checks if the supervisor is part of the FYP Office (PEC). If true, it renders a "Switch to PEC" button in the header.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/pec/check-supervisor/:supervisorId`

### 4.2. Fetch Supervisor Ideas
- **Defined In:** `src/components/SupervisorDashboard/api.js` (`fetchIdeasApi`)
- **Used In:** `src/components/SupervisorDashboard/index.jsx` (inside `handleFetchIdeas` function)
- **Description / Purpose:** Retrieves all the project ideas that this specific supervisor has created.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/ideas/supervisor/:supervisorId`

### 4.3. Post Idea
- **Defined In:** `src/components/SupervisorDashboard/api.js` (`postIdeaApi`)
- **Used In:** `src/components/SupervisorDashboard/index.jsx` (inside `handlePostIdea` function)
- **Description / Purpose:** Allows the supervisor to publish a new project idea to the system for students to see.
- **HTTP Method:** `POST`
- **Endpoint Route:** `/api/ideas/supervisor/:supervisorId`
- **Payload / Data Sent (JSON Body):**
  ```json
  { "title": "Idea Title", "description": "Idea Description" }
  ```

### 4.4. Fetch Requests
- **Defined In:** `src/components/SupervisorDashboard/api.js` (`fetchRequestsApi`)
- **Used In:** `src/components/SupervisorDashboard/index.jsx` (inside `handleFetchRequests` function)
- **Description / Purpose:** Fetches incoming supervision requests from students who want to work with this supervisor.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/supervisor/requests/:supervisorId`

### 4.5. Accept Request
- **Defined In:** `src/components/SupervisorDashboard/api.js` (`acceptRequestApi`)
- **Used In:** `src/components/SupervisorDashboard/index.jsx` (inside `handleAcceptRequest` function)
- **Description / Purpose:** Approves a student's supervision request, officially creating a supervised group under this faculty member.
- **HTTP Method:** `PATCH`
- **Endpoint Route:** `/api/supervisor/accept-request/:requestId`

### 4.6. Reject Request
- **Defined In:** `src/components/SupervisorDashboard/api.js` (`rejectRequestApi`)
- **Used In:** `src/components/SupervisorDashboard/index.jsx` (inside `handleRejectRequest` function)
- **Description / Purpose:** Rejects a student's supervision request.
- **HTTP Method:** `PATCH`
- **Endpoint Route:** `/api/supervisor/reject-request/:requestId`

### 4.7. Fetch Supervised Groups
- **Defined In:** `src/components/SupervisorDashboard/api.js` (`fetchGroupsApi`)
- **Used In:** `src/components/SupervisorDashboard/index.jsx` (inside `handleFetchGroups` function)
- **Description / Purpose:** Fetches the list of all active groups that the supervisor is officially mentoring.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/groups/my-groups/:supervisorId`

### 4.8. Fetch Evaluation Groups
- **Defined In:** `src/components/SupervisorDashboard/api.js` (`fetchEvalGroupsApi`)
- **Used In:** `src/components/SupervisorDashboard/index.jsx` (inside `handleFetchEvalGroups` function)
- **Description / Purpose:** Fetches groups that this supervisor is assigned to evaluate as an external committee member.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/groups/my-evaluation-groups/:supervisorId`

### 4.9. Fetch Group Repo
- **Defined In:** `src/components/SupervisorDashboard/api.js` (`fetchGroupRepoApi`)
- **Used In:** `src/components/SupervisorDashboard/index.jsx` (inside `handleFetchGroupRepo` function)
- **Description / Purpose:** Fetches the GitHub repository URL linked to a specific group.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/groups/repo/:groupId`

### 4.10. Update Group Repo
- **Defined In:** `src/components/SupervisorDashboard/api.js` (`updateGroupRepoApi`)
- **Used In:** `src/components/SupervisorDashboard/index.jsx` (inside `handleUpdateRepo` function)
- **Description / Purpose:** Updates or links a new GitHub repository URL to a student group so their performance can be tracked.
- **HTTP Method:** `PATCH`
- **Endpoint Route:** `/api/groups/update-repo/:groupId`
- **Payload / Data Sent (JSON Body):**
  ```json
  { "repoUrl": "https://github.com/...", "githubUsernames": [] }
  ```

### 4.11. Fetch Github Analytics (Proxy)
- **Defined In:** `src/components/SupervisorDashboard/api.js` (`fetchGithubApi`)
- **Used In:** `src/components/SupervisorDashboard/index.jsx` (inside `handleCheckPerformance` function)
- **Description / Purpose:** Proxies requests to GitHub via backend to fetch commit analytics and issues for groups.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/github-api:path`
- **Headers:** `Authorization: token VITE_GITHUB_PAT`

### 4.12. Fetch Evaluation Form
- **Defined In:** `src/components/SupervisorDashboard/api.js` (`fetchEvaluationFormApi`)
- **Used In:** `src/components/SupervisorDashboard/index.jsx` (inside `handleOpenEvaluate` function)
- **Description / Purpose:** Retrieves the grading rubric and phases required to evaluate a group's project.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/evaluation/evaluation-form/:groupId`

### 4.13. Fetch Phase Status
- **Defined In:** `src/components/SupervisorDashboard/api.js` (`fetchPhaseStatusApi`)
- **Used In:** `src/components/SupervisorDashboard/index.jsx` (inside `handleSelectPhase` function)
- **Description / Purpose:** Checks if a specific phase is locked, or if the group has uploaded their necessary documents yet.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/evaluation/status/:groupId/:phaseId`

### 4.14. Fetch Phase Document
- **Defined In:** `src/components/SupervisorDashboard/api.js` (`fetchPhaseDocumentApi`)
- **Used In:** `src/components/SupervisorDashboard/index.jsx` (inside `handleSelectPhase` function)
- **Description / Purpose:** Fetches the student's uploaded document so the supervisor can read it before grading.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/evaluation/view-document/:groupId/:phaseId`

### 4.15. Fetch Phase Marks
- **Defined In:** `src/components/SupervisorDashboard/api.js` (`fetchPhaseMarksApi`)
- **Used In:** `src/components/SupervisorDashboard/index.jsx` (inside `handleSelectPhase` function)
- **Description / Purpose:** Fetches any marks the supervisor has already submitted for this phase (to view or edit).
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/evaluation/marks/:groupId/:phaseId`

### 4.16. Submit Phase Marks
- **Defined In:** `src/components/SupervisorDashboard/api.js` (`submitPhaseMarksApi`)
- **Used In:** `src/components/SupervisorDashboard/index.jsx` (inside `handleSubmitPhaseMarks` function)
- **Description / Purpose:** Submits the final graded scores for a phase. Hits a different endpoint based on whether the evaluator is the main supervisor or a committee member.
- **HTTP Method:** `POST`
- **Endpoint Route:** `/api/evaluation/submit/supervisor/...` OR `/api/evaluation/submit/committee/...`
- **Payload / Data Sent (JSON Body):**
  ```json
  { "scores": [{ "rubricId": 1, "marks": 8, "feedback": "Good job" }] }
  ```

### 4.17. Fetch Chat Messages (Supervisor)
- **Defined In:** `src/components/SupervisorDashboard/api.js` (`fetchChatMessagesApi`)
- **Used In:** `src/components/SupervisorDashboard/index.jsx` (inside `loadMessages` useEffect)
- **Description / Purpose:** Fetches chat history for communicating with a supervised group.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/chat/messages/:groupId`

### 4.18. Send Chat Message (Supervisor)
- **Defined In:** `src/components/SupervisorDashboard/api.js` (`sendChatMessageApi`)
- **Used In:** `src/components/SupervisorDashboard/index.jsx` (inside `handleSendChatMessage` function)
- **Description / Purpose:** Sends a message from the supervisor to the group.
- **HTTP Method:** `POST`
- **Endpoint Route:** `/api/chat/send`
- **Payload / Data Sent (JSON Body):**
  ```json
  { "groupId": 1, "senderRole": "supervisor", "senderId": 10, "senderName": "Name", "message": "Content" }
  ```

---

## 5. Admin Dashboard 
Used by the system administrator to configure the system. All APIs defined in `AdminDashboard/api.js`.

### 5.1. Fetch Phases
- **Defined In:** `src/components/AdminDashboard/api.js` (`fetchPhasesApi`)
- **Used In:** `src/components/AdminDashboard/index.jsx` (inside `handleViewPhases` function)
- **Description / Purpose:** Fetches the defined system-wide evaluation phases (e.g. Mid Eval, Final Eval) so admin can configure them.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/evaluation/phases`

### 5.2. Save Phase
- **Defined In:** `src/components/AdminDashboard/api.js` (`savePhaseApi`)
- **Used In:** `src/components/AdminDashboard/index.jsx` (inside `handleSavePhase` function)
- **Description / Purpose:** Creates a new phase or updates the deadline of an existing evaluation phase.
- **HTTP Method:** `POST` or `PATCH`
- **Endpoint Route:** `/api/evaluation/phases` OR `/api/evaluation/:id`
- **Payload / Data Sent (JSON Body):**
  ```json
  { "name": "Phase Name", "deadline": "2024-12-31" }
  ```

### 5.3. Delete Phase
- **Defined In:** `src/components/AdminDashboard/api.js` (`deletePhaseApi`)
- **Used In:** `src/components/AdminDashboard/index.jsx` (inside `handleDeletePhase` function)
- **Description / Purpose:** Permanently deletes an evaluation phase.
- **HTTP Method:** `DELETE`
- **Endpoint Route:** `/api/evaluation/:id`

### 5.4. Fetch Rubrics
- **Defined In:** `src/components/AdminDashboard/api.js` (`fetchRubricsApi`)
- **Used In:** `src/components/AdminDashboard/index.jsx` (inside `fetchRubrics` function)
- **Description / Purpose:** Retrieves the specific grading criteria (rubrics) assigned to a phase so admin can edit or delete them.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/evaluation/rubrics/:phaseId`

### 5.5. Save Rubric
- **Defined In:** `src/components/AdminDashboard/api.js` (`saveRubricApi`)
- **Used In:** `src/components/AdminDashboard/index.jsx` (inside `handleSaveRubric` function)
- **Description / Purpose:** Creates or edits a grading rubric for a phase.
- **HTTP Method:** `POST` or `PATCH`
- **Endpoint Route:** `/api/evaluation/rubrics` OR `/api/evaluation/rubrics/:id`
- **Payload / Data Sent (JSON Body):**
  ```json
  { "name": "Rubric Name", "maxMarks": 10, "phaseId": 1 }
  ```

### 5.6. Delete Rubric
- **Defined In:** `src/components/AdminDashboard/api.js` (`deleteRubricApi`)
- **Used In:** `src/components/AdminDashboard/index.jsx` (inside `handleDeleteRubric` function)
- **Description / Purpose:** Permanently deletes a grading rubric from the system.
- **HTTP Method:** `DELETE`
- **Endpoint Route:** `/api/evaluation/rubrics/:id`

### 5.7. Fetch PEC Committees (Admin)
- **Defined In:** `src/components/AdminDashboard/api.js` (`fetchPecCommitteesApi`)
- **Used In:** `src/components/AdminDashboard/index.jsx` (inside `handleViewCommittees` / `fetchPecCommittees` function)
- **Description / Purpose:** Fetches all PEC committees to list them in the admin view.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/pec/all`

### 5.8. Fetch Supervisors (Admin)
- **Defined In:** `src/components/AdminDashboard/api.js` (`fetchSupervisorsApi`)
- **Used In:** `src/components/AdminDashboard/index.jsx` (inside `fetchSupervisors` function)
- **Description / Purpose:** Fetches all system supervisors.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/supervisor/all`

### 5.9. Save PEC Committee (Admin)
- **Defined In:** `src/components/AdminDashboard/api.js` (`savePecCommitteeApi`)
- **Used In:** `src/components/AdminDashboard/index.jsx` (inside `handleSaveCommittee` function)
- **Description / Purpose:** Creates or updates a PEC committee, assigning supervisors to it.
- **HTTP Method:** `POST` or `PATCH`
- **Endpoint Route:** `/api/pec/create` OR `/api/pec/update/:id`
- **Payload / Data Sent (JSON Body):**
  ```json
  { "name": "Committee Name", "domain": "Domain Name", "supervisorIds": [1, 2] }
  ```

### 5.10. Save Proposal Manually (Admin Backdoor)
- **Defined In:** `src/components/AdminDashboard/api.js` (`saveProposalApi`)
- **Used In:** `src/components/AdminDashboard/index.jsx` (inside `handleSaveProposal` function)
- **Description / Purpose:** A backdoor for the admin/FYP office to forcefully save/upload a proposal on behalf of a student.
- **HTTP Method:** `POST`
- **Endpoint Route:** `/api/fyp-office/save-proposal`
- **Payload / Data Sent:** `FormData` containing proposal details and the file.

### 5.11. Signup User
- **Defined In:** `src/components/AdminDashboard/api.js` (`signupUserApi`)
- **Used In:** `src/components/AdminDashboard/index.jsx` (inside `handleSignupUser` function)
- **Description / Purpose:** Allows the admin to manually create accounts for new students, supervisors, or staff.
- **HTTP Method:** `POST`
- **Endpoint Route:** `/api/auth/signup`
- **Payload / Data Sent (JSON Body):**
  ```json
  { "email": "user@email.com", "password": "123", "role": "student", "name": "User Name" }
  ```

### 5.12. Create Committees Automatically
- **Defined In:** `src/components/AdminDashboard/api.js` (`createCommitteesApi`)
- **Used In:** `src/components/AdminDashboard/index.jsx` (inside `handleCreateCommittees` function)
- **Description / Purpose:** Runs a backend algorithm to automatically generate Evaluation Committees based on supervisor domains and load.
- **HTTP Method:** `POST`
- **Endpoint Route:** `/api/committee/create-committees`

### 5.13. Fetch Committees Details
- **Defined In:** `src/components/AdminDashboard/api.js` (`fetchCommitteesDetailsApi`)
- **Used In:** `src/components/AdminDashboard/index.jsx` (inside `handleViewCommittees` function)
- **Description / Purpose:** Fetches the highly detailed structure of the auto-generated evaluation committees.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/committee/committees-details`

### 5.14. Update Evaluation Committees
- **Defined In:** `src/components/AdminDashboard/api.js` (`updateEvalCommitteesApi`)
- **Used In:** `src/components/AdminDashboard/index.jsx` (inside `handleSaveAssignedCommittees` function)
- **Description / Purpose:** Saves any manual adjustments the admin makes to the generated evaluation committees before finalizing.
- **HTTP Method:** `POST`
- **Endpoint Route:** `/api/committee/update-committees`
- **Payload / Data Sent (JSON Body):** Array of updated committee objects.

### 5.15. Assign Committees
- **Defined In:** `src/components/AdminDashboard/api.js` (`assignCommitteesApi`)
- **Used In:** `src/components/AdminDashboard/index.jsx` (inside `handleAssignCommitteesToGroups` function)
- **Description / Purpose:** Locks in and formally assigns the evaluation committees to the student groups.
- **HTTP Method:** `POST`
- **Endpoint Route:** `/api/committee/assign-committees`

### 5.16. Search User
- **Defined In:** `src/components/AdminDashboard/api.js` (`searchUserApi`)
- **Used In:** `src/components/AdminDashboard/index.jsx` (inside `handleSearchUser` function)
- **Description / Purpose:** Searches for a specific user account in the system so the admin can manage them.
- **HTTP Method:** `GET`
- **Endpoint Route:** `/api/auth/search-user?role=:role&query=:query`

### 5.17. Reset User Password
- **Defined In:** `src/components/AdminDashboard/api.js` (`resetPasswordApi`)
- **Used In:** `src/components/AdminDashboard/index.jsx` (inside `handleResetPassword` function)
- **Description / Purpose:** Overrides and resets the password for a user who has lost access to their account.
- **HTTP Method:** `POST`
- **Endpoint Route:** `/api/auth/admin-reset-password`
- **Payload / Data Sent (JSON Body):**
  ```json
  { "userId": 1, "newPassword": "new-password" }
  ```
