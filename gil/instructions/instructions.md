# Project Overview

**Goal:**  
Build a **React Native + Expo** application named **Health Coach AI** that serves as a personal AI companion for health coaching. The app will integrate real-time chat functionality with OpenAI GPT-4o (managed by LangGraph) and maintain a **persistent user memory system** for personalized coaching responses.

**Key Objectives:**
- Provide a real-time chat screen where users can send messages and receive AI-driven health coaching in return.
- Implement a **dynamic memory screen** to store and manage long-term user memories (e.g., preferences, dietary restrictions, goals).
- Integrate a Node.js + Express backend with Supabase for data storage (chat history, user memories, user authentication).
- Ensure the AI agent can retrieve both recent chat history and long-term memories to deliver context-aware, personalized responses.
- Adhere to performance best practices and ensure data privacy for health-related user data.

**Target Platforms:**  
- **iOS** and **Android** via **React Native (Expo Managed Workflow)**

**Dependencies:**
- **Frontend:**
  - React Native + Expo (UI components, cross-platform deployment)
  - Zustand (state management)
- **Backend:**
  - Node.js + Express (API routes, bridging between Supabase and the AI agent)
  - Supabase (database, authentication, real-time subscriptions)
- **AI Interaction:**
  - LangGraph (manages multi-step conversation flows, function calls, memory retrieval)
  - OpenAI GPT-4o (LLM for health coaching responses)

---

# Features

1. **Chat Screen**
   - Displays real-time conversation between the user and the AI health coach.
   - Stores user messages and AI responses in Supabase.
   - Not editable or searchable by the user, but the AI can reference past messages if needed.

2. **Memory Screen**
   - Displays a list of user-created memories (e.g., health goals, dietary restrictions).
   - Users can edit or delete these memories in real time.
   - Updates are immediately reflected in Supabase.
   - The AI proactively references these memories to personalize health recommendations.

3. **AI Agent Integration**
   - Uses LangGraph to orchestrate conversation flow and memory retrieval logic.
   - Employs GPT-4o for context-aware health coaching responses.
   - Dynamically retrieves relevant user memories to tailor advice without explicit user prompts.

4. **User Authentication**
   - Supabase handles user sign-up/sign-in.
   - Row-Level Security (RLS) ensures each user can only access their own chat messages and memories.

5. **Real-time Updates**
   - Supabase real-time subscriptions for chat messages (and optionally for memory updates).
   - Ensures new messages or memory changes appear immediately for the user.

6. **Performance & Offline Considerations**
   - Lazy loading or pagination for large chat histories.
   - Local caching of messages or memories for offline access, with queued sync on reconnection.
   - Memory optimization in AI responses by referencing only the most relevant conversation history.

---

# Requirements For Each Feature

## 1. Chat Screen

**Functional:**
- Displays an ongoing conversation: user messages on the right, AI messages on the left.
- On “Send” action, the user’s message is persisted in Supabase, then passed to the AI agent for processing.
- AI responses are appended to the chat once generated.

**Non-Functional:**
- Should feel responsive, ideally with real-time updates (Supabase subscriptions).
- Minimal latency between user message submission and AI response.

**Error Handling:**
- If message submission fails (e.g., network error), show an error banner and allow retry.
- If AI response fails, display a fallback message or a “Try again” prompt.

---

## 2. Memory Screen

**Functional:**
- Displays a list of memories (timestamp, category, content, importance).
- Tapping on a memory allows in-place editing or deletion.
- Changes are immediately written to Supabase, updating the server state in real time.

**Non-Functional:**
- Edits or deletions should sync quickly; minimal user confusion over “saved” state.
- Basic offline handling: If offline, changes queue locally and sync when reconnected.

**Error Handling:**
- If memory creation/update fails, show a toast or banner indicating failure.
- Validate user inputs (e.g., importance is an integer between 1–5).

---

## 3. AI Agent Integration

**Functional:**
- LangGraph orchestrates conversation flow:
  - Receives user message + relevant memories from Supabase.
  - Calls GPT-4o to generate context-aware response.
  - Persists the AI response in Supabase and returns it to the frontend.
- Memory retrieval is **automatic**: The agent searches user memories for relevant data (e.g., diet preferences) and uses them in responses.

**Non-Functional:**
- Responses should be generated near real-time.
- Keep context size in mind—older chats may be summarized or archived if needed.

**Error Handling:**
- If GPT-4o API call fails, show a default error message in the chat.
- Log the error server-side for debugging.

---

## 4. User Authentication

**Functional:**
- Email/Password-based auth for MVP.
- Supabase manages sessions and tokens; the React Native app stores and refreshes these tokens securely.
- Each user has a unique `user_id` that is linked to their `chat_messages` and `memories`.

**Non-Functional:**
- Ensure a smooth sign-up/sign-in flow with minimal friction.
- Consider adding social auth in future iterations if user demand is high.

**Error Handling:**
- If credentials are invalid, show a clear error message.
- If token refresh fails, log the user out and prompt re-login.

---

## 5. Real-time Updates

**Functional:**
- Use Supabase subscriptions on `chat_messages` and `memories` tables to push updates to the client.
- On receiving new chat messages or memory updates, update the local UI immediately.

**Non-Functional:**
- Should handle moderate user concurrency (tens to a few hundred users).
- Potentially scale if user base grows, using connection pooling or additional infrastructure.

**Error Handling:**
- If real-time subscription fails (e.g., network issues), revert to manual polling or queue events until reconnection.

---

# Data Models

### `chat_messages`
- **id** (UUID, primary key)
- **user_id** (UUID, foreign key referencing Supabase `auth.users`)
- **content** (text)
- **role** (text, `'user'` or `'assistant'`)
- **created_at** (timestamp with time zone)

### `memories`
- **id** (UUID, primary key)
- **user_id** (UUID, foreign key referencing Supabase `auth.users`)
- **category** (text, one of `'diet'`, `'exercise'`, `'goals'`, `'preferences'`)
- **content** (text)
- **importance** (integer, 1–5)
- **created_at** (timestamp with time zone)
- **updated_at** (timestamp with time zone)

**Row-Level Security (RLS) Policies**  
- Each table has RLS enabled.
- Users can only `SELECT`, `INSERT`, `UPDATE`, `DELETE` their own rows (checked against `auth.uid()`).

---

# API Contract

## Express Server (Node.js) Endpoints

1. **POST /api/chat**
   - **Request Body:**
     ```json
     {
       "user_id": "UUID",
       "message": "string"
     }
     ```
   - **Process:**
     - Inserts user message into `chat_messages`.
     - Orchestrates AI agent to generate a response.
     - Stores AI response in `chat_messages`.
   - **Response:**
     ```json
     {
       "status": "success",
       "assistant_message": "string"
     }
     ```

2. **GET /api/chat?user_id=UUID**
   - **Response:**
     ```json
     {
       "chat_history": [
         {
           "id": "UUID",
           "content": "string",
           "role": "user|assistant",
           "created_at": "2025-02-24T12:34:56Z"
         },
         ...
       ]
     }
     ```

3. **POST /api/memories**
   - **Request Body:**
     ```json
     {
       "user_id": "UUID",
       "category": "diet|exercise|goals|preferences",
       "content": "string",
       "importance": 3
     }
     ```
   - **Response:**
     ```json
     {
       "status": "success",
       "memory_id": "UUID"
     }
     ```

4. **PATCH /api/memories/:memory_id**
   - **Request Body:**
     ```json
     {
       "content": "string",
       "importance": 4
     }
     ```
   - **Response:**
     ```json
     {
       "status": "updated"
     }
     ```

5. **DELETE /api/memories/:memory_id**
   - **Response:**
     ```json
     {
       "status": "deleted"
     }
     ```

---

# Additional Considerations

1. **Database Setup:**
   - The Supabase tables (`chat_messages` and `memories`) are already set up and verified.
   - Frontend and backend development will proceed with these tables as the source of truth.

2. **Express Backend Timing:**
   - For the MVP, the Expo frontend will use mocked API endpoints to simulate responses.
   - This allows UI development to proceed concurrently while the actual Express backend is being built.
   - When the backend is ready, the mocks will be replaced with real API calls.

3. **Memory Archiving Strategy:**
   - For simplicity in the MVP, implement a basic archiving strategy:
     - Archive or summarize messages older than 30 days.
     - Do not create a separate table; instead, mark messages as archived or store a summary alongside the chat history.
     - Retrieval of archived content will be managed by fetching the summarized data when needed.
   - This approach can be refined in future iterations.

4. **Error Handling Standards:**
   - Implement centralized error handling in the Express backend using middleware and custom error classes.
   - Define specific error codes and messages to ensure consistency.
   - On the frontend, catch API errors and display user-friendly messages.
   - Document these error standards in your codebase and instructions for clarity.

5. **Testing Strategy:**
   - **Unit Tests:** Write tests for critical components (both backend and frontend) using Jest and React Native Testing Library.
   - **Integration Tests:** Verify that the frontend and backend work together as expected (using tools like supertest for the backend).
   - **End-to-End (E2E) Tests:** Plan for E2E tests (e.g., using Detox for React Native) once core features are stable.
   - Keep the testing strategy simple for the MVP and expand as the project evolves.

---

# Summary & Next Steps

With this outline, we can begin implementing **Health Coach AI** by focusing on:
1. **Setting up Supabase** (tables, RLS, and authentication are in place).
2. **Building the Express backend** (API endpoints for chat messages and memories), with initial mocks used in the frontend.
3. **Integrating the React Native + Expo frontend** (Chat Screen, Memory Screen) using the verified Supabase schema.
4. **Orchestrating the AI agent** via LangGraph to ensure context-aware health coaching.
5. **Implementing standardized error handling and a testing strategy** to maintain quality as we build out the MVP.

This document serves as a consistent roadmap and accountability guide as we progress further with the MVP.
