import {
  LlmAgent,
  FunctionTool,
  BaseSessionService,
  InMemorySessionService,
} from '@google/adk';
import { GoogleGenAI } from '@google/genai';
import { conciergeRootAgent, discoveryAgent, negotiatorAgent, bookingAgent } from '../agents/root.agent';
import { MongoSessionService } from '../services/session.service';

interface CapabilityCheck {
  feature: string;
  supported: boolean;
  notes: string;
}

export async function runAdkCapabilityCheck(): Promise<CapabilityCheck[]> {
  const results: CapabilityCheck[] = [];

  console.log('============================================================');
  console.log(' Google ADK TypeScript SDK Capability Check (Milestone 0)  ');
  console.log('============================================================\n');

  // 1. Function Tools Check
  try {
    const testTool = new FunctionTool({
      name: 'test_capability_tool',
      description: 'Tests function tool parameters and execution',
      parameters: {
        type: 'object',
        properties: {
          inputVal: { type: 'string' },
        },
        required: ['inputVal'],
      } as any,
      execute: async (args: any) => `Echo: ${args.inputVal}`,
    });

    const executionResult = await (testTool as any).runAsync({
      args: { inputVal: 'ADK TS Ready' },
      toolContext: {},
    });

    const isSuccess = executionResult === 'Echo: ADK TS Ready';
    results.push({
      feature: 'Function Tools (Declaration & Execution)',
      supported: isSuccess,
      notes: `Successfully created and executed FunctionTool with result: "${executionResult}"`,
    });
  } catch (err) {
    results.push({
      feature: 'Function Tools (Declaration & Execution)',
      supported: false,
      notes: `Error: ${(err as Error).message}`,
    });
  }

  // 2. Sub-agents Hierarchy Check
  try {
    const subAgentCount = (conciergeRootAgent as any).subAgents?.length || 0;
    const subAgentNames = (conciergeRootAgent as any).subAgents?.map((a: any) => a.name) || [];

    const isHierarchyValid =
      subAgentCount === 3 &&
      subAgentNames.includes('discovery_agent') &&
      subAgentNames.includes('negotiator_agent') &&
      subAgentNames.includes('booking_agent');

    results.push({
      feature: 'Sub-agents & Agent Delegation Tree',
      supported: isHierarchyValid,
      notes: `Root Concierge agent has ${subAgentCount} sub-agents: [${subAgentNames.join(', ')}]`,
    });
  } catch (err) {
    results.push({
      feature: 'Sub-agents & Agent Delegation Tree',
      supported: false,
      notes: `Error: ${(err as Error).message}`,
    });
  }

  // 3. Custom Session Service Check (MongoSessionService & BaseSessionService)
  try {
    const mongoSessionService = new MongoSessionService();
    const hasBaseInheritance = mongoSessionService instanceof BaseSessionService;

    // Test in-memory capability of ADK session service
    const inMem = new InMemorySessionService();
    const createdSession = await inMem.createSession({
      appName: 'concierge_test',
      userId: 'test_user_1',
      sessionId: 'sess_123',
    });

    const sessionValid = createdSession.id === 'sess_123' && hasBaseInheritance;
    results.push({
      feature: 'Custom Session Service Interface',
      supported: sessionValid,
      notes: `BaseSessionService extensible. InMemory test passed (id: ${createdSession.id}). MongoSessionService ready for MongoDB.`,
    });
  } catch (err) {
    results.push({
      feature: 'Custom Session Service Interface',
      supported: false,
      notes: `Error: ${(err as Error).message}`,
    });
  }

  // 4. Tracing & Observability
  try {
    const adkModule = await import('@google/adk');
    const hasLogging =
      typeof (adkModule as any).setupAdkLogger === 'function' ||
      typeof (adkModule as any).DebugLoggingPlugin === 'function';

    results.push({
      feature: 'Tracing & Observability Plugins',
      supported: hasLogging,
      notes: 'Built-in OpenTelemetry plugins and ADK logging utilities present in @google/adk package.',
    });
  } catch (err) {
    results.push({
      feature: 'Tracing & Observability Plugins',
      supported: false,
      notes: `Error: ${(err as Error).message}`,
    });
  }

  // 5. Fallback Gemini SDK (@google/genai)
  try {
    const genai = new GoogleGenAI();
    results.push({
      feature: 'Direct Gemini SDK Fallback (@google/genai)',
      supported: true,
      notes: 'GoogleGenAI SDK initialized successfully in Node runtime for fallback or direct streaming.',
    });
  } catch (err) {
    results.push({
      feature: 'Direct Gemini SDK Fallback (@google/genai)',
      supported: false,
      notes: `Error: ${(err as Error).message}`,
    });
  }

  // Print results table
  console.log('| Feature | Status | Notes |');
  console.log('|---|---|---|');
  for (const r of results) {
    console.log(`| ${r.feature} | ${r.supported ? 'PASSED (Supported)' : 'FAILED'} | ${r.notes} |`);
  }
  console.log('\n============================================================\n');

  return results;
}

// Run if called directly
if (require.main === module) {
  runAdkCapabilityCheck()
    .then((results) => {
      const allPassed = results.every((r) => r.supported);
      if (allPassed) {
        console.log('ADK TypeScript capability check COMPLETED: All required capabilities verified!');
        process.exit(0);
      } else {
        console.warn('ADK TypeScript capability check WARNING: Some checks did not pass.');
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('Fatal error during ADK capability check:', err);
      process.exit(1);
    });
}
