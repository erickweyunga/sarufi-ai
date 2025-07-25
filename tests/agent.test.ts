import { Agent } from "../src";
import { SessionContext, Strategy } from "../src/types";
import { z } from "zod";
import { tool } from "ai";

const correctSalesTools = {
    getProductInfo: tool({
        description: 'Get information about our product pricing and features',
        inputSchema: z.object({
            productType: z.enum(['basic', 'pro', 'enterprise']).describe('Product tier to get info for'),
        }),
        execute: async ({ productType }) => {
            const products = {
                basic: { price: '$99/month', features: ['Core features', 'Email support'], seats: '1-5 users' },
                pro: { price: '$299/month', features: ['All basic features', 'Advanced analytics', 'Phone support'], seats: '5-25 users' },
                enterprise: { price: 'Custom pricing', features: ['All pro features', 'Custom integrations', 'Dedicated support'], seats: 'Unlimited' }
            };
            return products[productType];
        }
    }),

    calculateROI: tool({
        description: 'Calculate potential ROI based on customer size and current costs',
        inputSchema: z.object({
            currentMonthlyCost: z.number().describe('What customer currently spends per month'),
            teamSize: z.number().describe('Number of team members'),
        }),
        execute: async ({ currentMonthlyCost, teamSize }) => {
            const efficiency_gain = 0.25; // 25% efficiency improvement
            const monthly_savings = currentMonthlyCost * efficiency_gain;
            const annual_savings = monthly_savings * 12;

            return {
                monthly_savings: Math.round(monthly_savings),
                annual_savings: Math.round(annual_savings),
                payback_period_months: Math.ceil(299 / monthly_savings),
                efficiency_gain_percent: 25
            };
        }
    }),

    checkAvailability: tool({
        description: 'Check if we can schedule a demo or onboard new customers',
        inputSchema: z.object({
            timeframe: z.string().describe('When the customer wants to start (e.g., "this week", "next month")'),
        }),
        execute: async ({ timeframe }) => {
            // Mock availability check
            const available = !timeframe.includes('this week'); // Busy this week
            return {
                available,
                nextAvailable: available ? timeframe : 'Next week',
                demoSlots: ['Tuesday 2PM', 'Wednesday 10AM', 'Friday 3PM']
            };
        }
    })
};

export async function testCorrectToolFormat() {
    const strategy: Strategy = {
        name: 'Correct Tool Sales Bot',
        domain: 'sales' as const,
        llm_provider: 'anthropic' as const,
        model: 'claude-3-5-sonnet-20241022',
        primary_goal: 'Use tools to provide accurate information and close deals',
        secondary_goals: ['Calculate ROI', 'Check availability', 'Provide pricing'],
        personality: {
            tone: 'professional' as const,
            style: 'consultative' as const,
            pace: 'medium' as const
        },
        guidelines: {
            must_do: [
                'Use getProductInfo tool when asked about pricing or features',
                'Use calculateROI tool when customer mentions current costs',
                'Use checkAvailability tool for demo requests',
                'Always use tools to get accurate data before responding'
            ],
            must_not_do: ['Make up pricing information', 'Guess at ROI calculations'],
            prefer_to_do: ['Use tools to provide specific numbers', 'Reference tool results in responses'],
            avoid_doing: ['Generic responses without tool data']
        },
        knowledge: {
            key_info: ['Tools provide accurate information', 'Always check data before responding'],
            common_questions: ['Pricing', 'ROI', 'Demo scheduling'],
            escalation_triggers: ['Custom enterprise requests']
        }
    };

    const context: SessionContext = {
        session_id: 'test-correct-tools',
        user_id: 'user-correct',
        strategy_name: 'Correct Tool Sales Bot',
        status: 'active' as const,
        current_goal: 'provide_accurate_info',
        messages_count: 0,
        user_inputs: {},
        user_profile: {},
        messages: [],
        agent_memory: {
            last_action: 'start',
            reasoning_history: [],
            failed_attempts: [],
            successful_patterns: []
        },
        created_at: new Date(),
        updated_at: new Date()
    };

    const agent = new Agent(strategy);

    console.log('=== Testing Correct Vercel AI SDK Tool Format ===\n');

    // Test 1: Pricing question
    console.log('🔹 Test 1: Pro Plan Pricing');
    const response1 = await agent.processPrompt(
        'What does the Pro plan cost and what features does it include?',
        context,
        correctSalesTools
    );
    console.log('Customer:', 'What does the Pro plan cost and what features does it include?');
    console.log('Agent:', response1.message);
    console.log('Action:', response1.action_taken);
    console.log('---\n');

    // Test 2: ROI calculation
    console.log('🔹 Test 2: ROI Calculation');
    const response2 = await agent.processPrompt(
        'I spend $1000/month currently with 20 team members. What savings could I see?',
        context,
        correctSalesTools
    );
    console.log('Customer:', 'I spend $1000/month currently with 20 team members. What savings could I see?');
    console.log('Agent:', response2.message);
    console.log('Action:', response2.action_taken);
    console.log('---\n');

    // Test 3: Demo scheduling
    console.log('🔹 Test 3: Demo Next Week');
    const response3 = await agent.processPrompt(
        'Can I schedule a demo for next week?',
        context,
        correctSalesTools
    );
    console.log('Customer:', 'Can I schedule a demo for next week?');
    console.log('Agent:', response3.message);
    console.log('Action:', response3.action_taken);
    console.log('---\n');

    console.log('=== Test Complete ===');
}

// Export the correctly formatted tools
export { correctSalesTools };

// Run the test
testCorrectToolFormat().catch(console.error);