import { remoteAgent } from 'genkit/beta/client';

// Shared client connecting to the NestJS backend on port 3001
export const agentClient = remoteAgent({
  url: 'http://localhost:3001/api/supportAgent',
});
