// Represents a Jira ticket fetched from the mock service (or a real Jira API)
export interface JiraTicket {
  key: string;
  summary: string;
  description: string;
  acceptanceCriteria: string;
  reporter: string;
  priority: 'High' | 'Medium' | 'Low';
}

// Represents a single step within a test case
export interface TestStep {
  id: string;
  step: string;
  data: string;
  expectedResult: string;
  sqlScript: string;
  // Raw template versions for parameter re-interpolation
  // These store the original string with {{variables}} intact so they can be re-evaluated if a parameter changes
  rawStep?: string;
  rawData?: string;
  rawExpectedResult?: string;
  rawSqlScript?: string;
}

// Represents a complete test case, either generated from a template or created manually
export interface TestCase {
  id: string;
  title: string;
  objective: string;
  preconditions: string; // Changed to string for textarea
  steps: TestStep[];
  source: 'AI' | 'TEMPLATE' | 'MANUAL';
  
  // New Fields matching Zephyr Scale
  status: string;
  priority: string;
  component: string;
  owner: string;
  estimatedTime: string;
  folder: string;
  labels: string[];

  // For templated cases, we store the raw template ID and the extracted values
  templateId?: string;
  parameters?: Record<string, string>;
  // Raw template versions for re-interpolation
  rawTitle?: string;
  rawObjective?: string;
  rawPreconditions?: string;
}

// Represents a reusable template that can generate one or more test cases
export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  variables: string[]; // e.g. ['table_name', 'fields']
  // CHANGED: Support multiple test cases per template
  // Omit fields that are specific to an instantiated test case
  testCases: Array<Omit<TestCase, 'id' | 'source' | 'parameters' | 'templateId' | 'rawTitle' | 'rawObjective' | 'rawPreconditions' >>;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  jiraTicket: JiraTicket;
  testCases: TestCase[];
  zephyrKeys?: string[];
}
