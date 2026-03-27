# ZephyrGate - Test Case Generator

ZephyrGate is an AI-powered test case generation tool that connects Jira requirements with Zephyr Scale. It uses Google's Gemini AI to extract parameters from Jira tickets and automatically generates parameterized test cases based on your custom templates.

## 🚀 Getting Started for Deployment

This application currently uses mock services for Jira and Zephyr to demonstrate functionality. To use this in a real environment with your own data, you will need to implement the actual API integrations.

Here is a step-by-by guide on what you need to change:

### 1. Environment Variables

Create a `.env` file in the root directory (you can copy `.env.example` if it exists) and add your API keys:

```env
# Required for AI Extraction
GEMINI_API_KEY=your_gemini_api_key_here

# Required for Real Jira/Zephyr Integration (Once implemented)
VITE_JIRA_BASE_URL=https://your-domain.atlassian.net
VITE_JIRA_EMAIL=your_email@domain.com
VITE_JIRA_API_TOKEN=your_jira_api_token
VITE_ZEPHYR_API_TOKEN=your_zephyr_scale_api_token
```

### 2. Implement Real API Services

Open `src/services/mockService.ts`. This file currently contains hardcoded mock data and simulated API delays. You need to replace these with real HTTP requests (e.g., using `fetch` or `axios`).

#### A. Jira Integration (`fetchJiraTicket`)

We have prepared a real implementation for you in `src/services/apiService.ts`.

**Endpoint:** `GET /rest/api/3/issue/{issueIdOrKey}`
**Documentation:** [Jira Cloud REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issueidorkey-get)

#### B. Zephyr Scale Integration (`publishToZephyr`)

We have prepared a real implementation for you in `src/services/apiService.ts`.

**Endpoint:** `POST /testcases`
**Documentation:** [Zephyr Scale Server/Data Center API](https://support.smartbear.com/zephyr-scale-server/api-docs/v1/) or [Zephyr Scale Cloud API](https://support.smartbear.com/zephyr-scale-cloud/api-docs/) (Ensure you use the correct one for your hosting).

#### C. How to switch to Real APIs

When you are ready to connect locally:
1. Open `src/App.tsx` and `src/components/Gatekeeper.tsx`.
2. Change the import from:
   `import { fetchJiraTicket, publishToZephyr } from './services/mockService';` (or similar)
   to:
   `import { fetchJiraTicket, publishToZephyr } from './services/apiService';`
3. Make sure your `.env` variables are correctly set.

### 3. Template Storage

Currently, templates are stored in memory (`INITIAL_TEMPLATES` in `mockService.ts`) and state. If you refresh the page, custom templates are lost.

To make templates persistent:
1.  **Local Storage:** Update `App.tsx` to save and load the `templates` state to `localStorage` (similar to how `history` is currently handled).
2.  **Database:** For a team environment, you should create a backend service (e.g., Node.js/Express with PostgreSQL or MongoDB) to store and retrieve templates so they are shared across all users.

### 4. CORS Issues (Important for Client-Side Apps)

If you are calling the Jira or Zephyr APIs directly from the browser (Client-Side), you will likely encounter **CORS (Cross-Origin Resource Sharing)** errors because those APIs do not typically allow direct browser access from unauthorized domains.

**Solutions:**
1.  **Backend Proxy (Recommended):** Convert this application to a Full-Stack app. Create a small Node.js/Express backend that handles the API requests to Jira and Zephyr. Your React frontend will call your backend, and your backend will call the external APIs. This hides your API keys and solves CORS.
2.  **Jira App/Forge:** If you are deploying this as an official Jira App using Atlassian Forge or Connect, the framework handles authentication and CORS for you.

### 5. Deployment

Once you have replaced the mock services and handled CORS, you can build the application:

```bash
npm run build
```

This will generate static files in the `dist/` directory, which you can host on any static hosting provider like Vercel, Netlify, AWS S3, or GitHub Pages.
