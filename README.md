# Sarufi-AI

**A TypeScript framework for building intelligent conversational agents with structured decision-making, tool integration, and multi-LLM support.**

## Features

- **Strategic AI Agents** - Define personality, goals, and guidelines for consistent behavior
- **Tool Integration** - Vercel AI SDK compatible tools for real-world interactions
- **Structured Decisions** - LLM outputs follow predefined schemas for reliability
- **Session Management** - Persistent conversation context and memory
- **Multi-LLM Support** - OpenAI, Anthropic (Claude), and Google (Gemini)
- **Analytics** - Built-in performance tracking and insights

## Quick Start

### 1. Install Dependencies

```bash
npm install ai zod
# Your preferred LLM provider
npm install @ai-sdk/anthropic  # or @ai-sdk/openai, @ai-sdk/google
```

### 2. Define Your Strategy

```typescript
import { Strategy } from "sarufi-ai";

const customerServiceStrategy: Strategy = {
  name: 'Customer Service Bot',
  domain: 'customer-support',
  llm_provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022',
  primary_goal: 'Resolve customer issues efficiently and empathetically',
  secondary_goals: ['Build customer satisfaction', 'Gather feedback'],
  personality: {
    tone: 'friendly and professional',
    style: 'helpful and patient',
    pace: 'adaptive to customer urgency'
  },
  guidelines: {
    must_do: ['Always acknowledge the customer concern', 'Use tools to find solutions'],
    must_not_do: ['Make promises without verification', 'Ignore customer emotions'],
    prefer_to_do: ['Ask clarifying questions', 'Provide step-by-step guidance'],
    avoid_doing: ['Technical jargon', 'Rushing the customer']
  },
  knowledge: {
    key_info: ['30-day return policy', 'Live chat available 9-5 EST'],
    common_questions: ['How to return?', 'Shipping time?', 'Product warranty?'],
    escalation_triggers: ['Refund over $500', 'Legal threats', 'Repeated complaints']
  }
};
```

### 3. Create Tools

```typescript
import { tool } from "ai";
import { z } from "zod";

const supportTools = {
  searchOrders: tool({
    description: 'Search customer orders by email or order ID',
    inputSchema: z.object({
      searchTerm: z.string().describe('Email or order ID to search'),
    }),
    execute: async ({ searchTerm }) => {
      // Your database/API logic here
      return { orders: [], customer: null };
    }
  }),

  createTicket: tool({
    description: 'Create a support ticket for complex issues',
    inputSchema: z.object({
      issue: z.string().describe('Description of the issue'),
      priority: z.enum(['low', 'medium', 'high']),
    }),
    execute: async ({ issue, priority }) => {
      // Create ticket in your system
      return { ticketId: 'TK-12345', status: 'created' };
    }
  })
};
```

### 4. Build and Run

```typescript
import { createBuilder } from "sarufi-ai";

const ai = createBuilder()
  .withStrategy(customerServiceStrategy)
  .build();

// Start a session with tools
const session = await ai.startSession(
  'user-123',
  'Customer Service Bot',
  {},
  supportTools
);

// Send messages
const response = await ai.sendMessage(
  session.session_id,
  "I can't find my order",
  supportTools
);

console.log(response.message);
```

## CLI Testing

Create a CLI interface for testing your agents:

```typescript
import { createInterface } from "readline";
import { createBuilder } from "sarufi-ai";

const ai = createBuilder().withStrategy(yourStrategy).build();
const rl = createInterface({ input: process.stdin, output: process.stdout });

const session = await ai.startSession('test-user', 'Your Bot', {}, yourTools);
console.log("Bot:", session.initial_message);

const chat = async () => {
  rl.question("You: ", async (input) => {
    if (input === "exit") return rl.close();
    
    const response = await ai.sendMessage(session.session_id, input, yourTools);
    console.log("Bot:", response.message);
    chat();
  });
};

chat();
```

## Architecture

### Strategy-Driven Approach
- **Strategy** defines the agent's personality, goals, and behavior rules
- **Tools** provide real-world capabilities (database queries, API calls, etc.)
- **Sessions** maintain conversation context and user state
- **Decisions** are structured outputs that follow your business logic

### Tool Integration
Tools use the Vercel AI SDK format and support:
- Parameter validation with Zod schemas
- Async execution with real API/database calls
- Automatic retry and error handling
- Tool result integration into conversations

### Session Management
- Persistent conversation history
- User profiling and intent detection
- Performance analytics and insights
- Automatic escalation based on rules

## Supported LLM Providers

| Provider | Models | Configuration |
|----------|--------|---------------|
| **Anthropic** | Claude 3.5 Sonnet, Haiku, Opus | `llm_provider: 'anthropic'` |
| **OpenAI** | GPT-4o, GPT-4 Turbo, GPT-3.5 | `llm_provider: 'openai'` |
| **Google** | Gemini 1.5 Pro, 2.5 Flash | `llm_provider: 'google'` |

## Examples

- **E-commerce**: Product search, inventory checking, order management
- **Customer Support**: Ticket creation, FAQ, issue resolution  
- **Sales**: Lead qualification, product recommendations, booking demos
- **Education**: Tutoring, course recommendations, progress tracking

## Advanced Features

- **Multi-step tool calls** for complex workflows
- **Context-aware responses** based on conversation history
- **Automatic performance monitoring** and optimization suggestions
- **Custom escalation rules** for human handoff
- **Built-in analytics** for conversation insights

---

**Get started building intelligent agents that actually work in production.**