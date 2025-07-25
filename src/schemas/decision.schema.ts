import z from "zod";

export const DecisionSchema = z.object({
    strategy_analysis: z.object({
        current_goal: z.string().describe("What the agent is trying to achieve right now"),
        goal_progress: z.enum(['not_started', 'in_progress', 'completed', 'blocked']).describe("Progress toward current goal"),
        situation_assessment: z.string().describe("Agent's understanding of the current situation"),
        relevant_guidelines: z.array(z.string()).describe("Which strategy rules apply to this situation"),
        opportunities: z.array(z.string()).describe("Opportunities identified in this session"),
        risk_factors: z.array(z.string()).describe("Potential risks or concerns to address")
    }),

    flow_decision: z.object({
        next_action: z.enum([
            'ask_discovery_question',
            'provide_information',
            'handle_objection',
            'build_value',
            'qualify_further',
            'propose_next_step',
            'escalate',
            'close_session'
        ]).describe("The specific action to take next"),
        reasoning: z.string().describe("Why this action was chosen"),
        confidence: z.number().min(0).max(1).describe("Confidence level in this decision"),
        urgency: z.enum(['low', 'medium', 'high']).describe("How urgent this action is"),
        backup_plan: z.string().describe("Alternative approach if this doesn't work")
    }),

    action_execution: z.object({
        message: z.string().describe("The actual message to send to the user"),
        message_intent: z.string().describe("What this message is trying to accomplish"),
        expected_user_response: z.string().describe("What kind of response we expect from the user"),
        context_updates: z.record(z.any(), z.any()).describe("Updates to make to the session context"),
        next_goal: z.string().describe("What the goal should be after this interaction")
    }),

    meta: z.object({
        session_stage: z.enum([
            'opening', 'discovery', 'qualification', 'presentation',
            'objection_handling', 'closing', 'follow_up'
        ]).describe("What stage of the session we're in"),
        user_sentiment: z.enum(['positive', 'neutral', 'negative', 'unknown']).describe("Detected user sentiment"),
        should_escalate: z.boolean().describe("Whether this session should be escalated"),
        escalation_reason: z.string().optional().describe("Why escalation is needed if applicable")
    })
});

export type Decision = z.infer<typeof DecisionSchema>;
