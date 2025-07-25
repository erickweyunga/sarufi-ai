import z from "zod";

export const StrategyAnalysisSchema = z.object({
    current_situation: z.string().describe('Description of the current conversation situation'),
    user_message: z.string().describe('The user\'s latest message'),
    context_summary: z.string().describe('Summary of conversation so far')
});

export const FlowDecisionSchema = z.object({
    strategy_analysis: z.string().describe('The strategy analysis result'),
    available_actions: z.array(z.string()).describe('List of available actions'),
    context_summary: z.string().describe('Current conversation context')
});

export const ActionExecutionSchema = z.object({
    action_type: z.enum(['ask_question', 'provide_info', 'handle_objection', 'escalate', 'close_conversation']),
    action_parameters: z.record(z.any(), z.any()).describe('Parameters for the action'),
    context_updates: z.record(z.any(), z.any()).describe('Updates to make to conversation context')
});