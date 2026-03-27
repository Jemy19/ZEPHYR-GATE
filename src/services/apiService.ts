import { JiraTicket, TestCase } from '../types/index';

// ============================================================================
// REAL API INTEGRATIONS (Not currently active)
// To use these, replace the imports in App.tsx and Gatekeeper.tsx 
// from './mockService' to './apiService'
// ============================================================================

export const fetchJiraTicket = async (key: string): Promise<JiraTicket> => {
  const response = await fetch(`${import.meta.env.VITE_JIRA_BASE_URL}/rest/api/3/issue/${key}`, {
    headers: {
      'Authorization': `Basic ${btoa(`${import.meta.env.VITE_JIRA_EMAIL}:${import.meta.env.VITE_JIRA_API_TOKEN}`)}`,
      'Accept': 'application/json'
    }
  });
  
  const data = await response.json();
  
  // Map the Jira API response to the local JiraTicket interface
  return {
    key: data.key,
    summary: data.fields.summary,
    description: data.fields.description, // Note: Jira v3 uses Atlassian Document Format (ADF) for descriptions, you may need to parse it to plain text.
    acceptanceCriteria: data.fields.customfield_XXXXX, // Replace XXXXX with your actual custom field ID for Acceptance Criteria
    reporter: data.fields.reporter.displayName,
    priority: data.fields.priority.name
  };
};

export const publishToZephyr = async (testCases: TestCase[], jiraKey: string): Promise<string[]> => {
  const createdKeys: string[] = [];

  for (const tc of testCases) {
    const payload = {
      projectKey: jiraKey.split('-')[0], // Assuming project key is the prefix of the Jira ticket
      name: tc.title,
      objective: tc.objective,
      precondition: tc.preconditions,
      statusName: tc.status,
      priorityName: tc.priority,
      componentName: tc.component,
      ownerAccountId: tc.owner, // Needs to be an Atlassian Account ID
      estimatedTime: tc.estimatedTime,
      labels: tc.labels,
      issueLinks: [jiraKey],
      testScript: {
        type: "STEP_BY_STEP",
        steps: tc.steps.map(step => ({
          description: step.step,
          testData: step.data,
          expectedResult: step.expectedResult
        }))
      }
    };

    const response = await fetch('https://api.zephyrscale.smartbear.com/v2/testcases', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_ZEPHYR_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    createdKeys.push(data.key);
  }

  return createdKeys;
};
