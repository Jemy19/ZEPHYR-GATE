import { JiraTicket, Template, TestCase } from '../types/index';

// --- Mock Data Service ---
// This file simulates backend interactions for fetching Jira tickets and publishing to Zephyr Scale.
// In a real application, these functions would be replaced with actual API calls to Jira and Zephyr.

// Mock database of Jira tickets used for testing the extraction flow
export const MOCK_TICKETS: Record<string, JiraTicket> = {
  'PROJ-123': {
    key: 'PROJ-123',
    summary: 'New Employee Table in Snowflake',
    description: 'We need to ingest a new table from the landing zone.\n\nSource: landing_datalake\nTarget: datalake_production\nTable: employee_records',
    acceptanceCriteria: '1. Table must be created in the target schema.\n2. Fields required: id, first_name, last_name, email, department.\n3. Row count must match source.',
    reporter: 'Data Eng',
    priority: 'High'
  },
  'PROJ-456': {
    key: 'PROJ-456',
    summary: 'Update User Profile API',
    description: 'The POST /api/v1/user/profile endpoint needs to accept a new field "bio". Max length 500 chars.',
    acceptanceCriteria: '1. API accepts "bio" in payload.\n2. DB updates correctly.\n3. Returns 200 OK.',
    reporter: 'Backend Team',
    priority: 'Medium'
  }
};

// Initial set of templates provided to the user when the app loads
// These templates contain variables (e.g., {{table_name}}) that the AI will attempt to fill
export const INITIAL_TEMPLATES: Template[] = [
  {
    id: 'tpl-data-ingest',
    name: 'Data Ingestion / Migration',
    category: 'Database',
    description: 'Validates source-to-target data movement, schema checks, and row counts.',
    variables: ['source_system', 'target_system', 'table_name', 'fields_list'],
    testCases: [
      {
        title: 'Verify Ingestion for {{table_name}}',
        objective: 'Ensure data is correctly migrated from {{source_system}} to {{target_system}} without loss.',
        preconditions: 'Access to {{source_system}}\nAccess to {{target_system}}',
        status: 'Draft',
        priority: 'Normal',
        component: 'None',
        owner: 'Unassigned',
        estimatedTime: '00:15',
        folder: 'None',
        labels: ['Data', 'Snowflake', 'Automated'],
        steps: [
          { id: 't-1', step: "Check schema in {{target_system}}", data: "N/A", expectedResult: "Columns exist: {{fields_list}}", sqlScript: "DESCRIBE {{table_name}};" },
          { id: 't-2', step: "Verify row count matches source", data: "Source Count from ETL Logs", expectedResult: "Row counts match exactly between {{source_system}} and {{target_system}}", sqlScript: "SELECT count(*) FROM {{table_name}};" },
          { id: 't-3', step: "Check for data truncation", data: "N/A", expectedResult: "Data appears complete", sqlScript: "SELECT * FROM {{table_name}} LIMIT 5;" }
        ]
      },
      {
        title: 'Data Types Check for {{table_name}}',
        objective: 'Verify that field data types in {{target_system}} match expectations.',
        preconditions: 'Table created in {{target_system}}',
        status: 'Draft',
        priority: 'Normal',
        component: 'None',
        owner: 'Unassigned',
        estimatedTime: '00:05',
        folder: 'None',
        labels: ['Data', 'Validation'],
        steps: [
           { id: 't-2-1', step: "Inspect table definition", data: "N/A", expectedResult: "Types match requirements in {{fields_list}}", sqlScript: "SHOW COLUMNS IN {{table_name}};" }
        ]
      }
    ]
  },
  {
    id: 'tpl-api-endpoint',
    name: 'API Endpoint Validation',
    category: 'API',
    description: 'Standard checks for new API fields including status codes and payload validation.',
    variables: ['endpoint_url', 'method', 'field_name'],
    testCases: [
      {
        title: 'Verify {{method}} {{endpoint_url}} - Success',
        objective: 'Ensure the endpoint handles the new field {{field_name}} correctly.',
        preconditions: 'API is running\nAuth token available',
        status: 'Draft',
        priority: 'High',
        component: 'API',
        owner: 'Unassigned',
        estimatedTime: '00:10',
        folder: 'None',
        labels: ['API', 'Integration', 'Positive'],
        steps: [
          { id: 't-1', step: "Send request with valid {{field_name}}", data: "{ \"{{field_name}}\": \"test_value\" }", expectedResult: "200 OK", sqlScript: "" }
        ]
      },
      {
        title: 'Verify {{method}} {{endpoint_url}} - Error Handling',
        objective: 'Ensure the endpoint rejects invalid {{field_name}}.',
        preconditions: 'API is running',
        status: 'Draft',
        priority: 'Normal',
        component: 'API',
        owner: 'Unassigned',
        estimatedTime: '00:10',
        folder: 'None',
        labels: ['API', 'Negative'],
        steps: [
          { id: 't-2', step: "Send request with invalid {{field_name}} (Type Mismatch)", data: "{ \"{{field_name}}\": 12345 }", expectedResult: "400 Bad Request", sqlScript: "" },
          { id: 't-3', step: "Send request with oversized {{field_name}}", data: "{ \"{{field_name}}\": \"[...500+ chars...]\" }", expectedResult: "400 or 422 Error", sqlScript: "" }
        ]
      }
    ]
  }
];

// Simulates fetching a Jira ticket by key with a slight network delay
export const fetchJiraTicket = async (key: string): Promise<JiraTicket> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const ticket = MOCK_TICKETS[key.toUpperCase()];
      if (ticket) resolve(ticket);
      else reject(new Error('Ticket not found'));
    }, 800);
  });
};

// Simulates publishing the generated test cases to Zephyr Scale, returning mock Zephyr IDs
export const publishToZephyr = async (testCases: TestCase[], jiraKey: string): Promise<string[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(testCases.map((_, i) => `TC-${Math.floor(Math.random() * 1000) + 1000 + i}`));
    }, 1500);
  });
};
