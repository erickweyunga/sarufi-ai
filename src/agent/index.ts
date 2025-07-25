import { generateText, stepCountIs, tool, type ToolSet } from "ai";
import type { Strategy, SessionContext, AgentResponse } from "../types";
import { getLanguageModel } from "../providers";
import { DecisionSchema, type Decision } from "../schemas/decision.schema";

export class Agent {
    private model: any;
    private strategy: Strategy;

    constructor(strategy: Strategy) {
        this.strategy = strategy;
        this.model = getLanguageModel(strategy);
    }

    async processPrompt(prompt: string, context: SessionContext, userTools: ToolSet = {}): Promise<AgentResponse> {
        try {
            const systemPrompt = this.composePrompt(context);

            const messages = [
                { role: 'system' as const, content: systemPrompt },
                ...context.messages.map(msg => ({
                    role: msg.role as 'user' | 'assistant',
                    content: msg.content
                })),
                { role: 'user' as const, content: prompt }
            ];

            const allTools = {
                ...userTools,
                answer: tool({
                    description: 'Make the final strategic decision about how to respond to the user',
                    inputSchema: DecisionSchema,
                })
            };

            const { toolCalls } = await generateText({
                model: this.model,
                tools: allTools,
                messages,
                toolChoice: 'required',
                stopWhen: stepCountIs(3),
                temperature: 0.7,
            });

            console.log("\n===================================================================================================================\n")
            console.log("TOOL CALLS:", JSON.stringify(toolCalls, null, 2));
            console.log("\n===================================================================================================================\n")

            const decisionCall = toolCalls.find(call => call.toolName === 'answer');

            if (!decisionCall) {
                throw new Error('No decision tool call found');
            }

            const decision = decisionCall.input as Decision;

            return this.interpretDecision(decision, prompt, context);

        } catch (error) {
            console.error('Agent Error:', error);
            return this.generateFallbackResponse(error);
        }
    }

    private composePrompt(context: SessionContext): string {
        const strategy = this.strategy;

        return `You are a conversation agent specialized in ${strategy.domain}.

CORE IDENTITY:
- Domain: ${strategy.domain}
- Tone: ${strategy.personality.tone}
- Style: ${strategy.personality.style}
- Pace: ${strategy.personality.pace}

PRIMARY OBJECTIVE: ${strategy.primary_goal}
SECONDARY OBJECTIVES: ${strategy.secondary_goals.join(', ')}

STRATEGY GUIDELINES:

MUST DO:
${strategy.guidelines.must_do.map(rule => `✓ ${rule}`).join('\n')}

MUST NOT DO:
${strategy.guidelines.must_not_do.map(rule => `✗ ${rule}`).join('\n')}

PREFER TO DO:
${strategy.guidelines.prefer_to_do.map(rule => `→ ${rule}`).join('\n')}

AVOID DOING:
${strategy.guidelines.avoid_doing.map(rule => `← ${rule}`).join('\n')}

KNOWLEDGE BASE:
Key Information: ${strategy.knowledge.key_info.join(' | ')}
Common Questions: ${strategy.knowledge.common_questions.join(' | ')}
Escalation Triggers: ${strategy.knowledge.escalation_triggers.join(' | ')}

CURRENT CONTEXT:
- Session ID: ${context.session_id}
- Current Goal: ${context.current_goal}
- Messages Exchanged: ${context.messages_count}
- User Profile: ${JSON.stringify(context.user_profile)}
- User Inputs So Far: ${JSON.stringify(context.user_inputs)}
- Last Action: ${context.agent_memory.last_action}

INSTRUCTIONS:
1. If you need specific information to answer the user, use the available tools FIRST
2. After gathering any needed information, use the makeDecision tool to provide your strategic response
3. Think step by step and be strategic, empathetic, and aligned with your guidelines

The makeDecision tool should contain your complete analysis and response strategy.`;
    }

    private interpretDecision(
        decision: Decision,
        prompt: string,
        context: SessionContext
    ): AgentResponse {
        const { strategy_analysis, flow_decision, action_execution, meta } = decision;

        const reasoning = [
            `Analysis: ${strategy_analysis.situation_assessment}`,
            `Decision: ${flow_decision.reasoning}`,
            `Action: ${action_execution.message_intent}`,
            `Confidence: ${Math.round(flow_decision.confidence * 100)}%`,
            `Stage: ${meta.session_stage}`
        ].join(' | ');

        const contextUpdates = {
            ...action_execution.context_updates,
            last_decision: decision,
            last_user_message: prompt,
            session_stage: meta.session_stage,
            user_sentiment: meta.user_sentiment,
            guidelines_considered: strategy_analysis.relevant_guidelines,
            opportunities_identified: strategy_analysis.opportunities,
            risks_identified: strategy_analysis.risk_factors,
            previous_goal: context.current_goal,
            current_goal: action_execution.next_goal,
            goal_progress: strategy_analysis.goal_progress,
            decision_confidence: flow_decision.confidence,
            backup_plan: flow_decision.backup_plan,
            escalation_needed: meta.should_escalate,
            escalation_reason: meta.escalation_reason,
            last_decision_time: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        return {
            message: action_execution.message,
            action_taken: flow_decision.next_action,
            reasoning: reasoning,
            confidence: flow_decision.confidence,
            context_updates: contextUpdates,
            suggested_next_user_action: action_execution.expected_user_response,
            meta: {
                session_stage: meta.session_stage,
                user_sentiment: meta.user_sentiment,
                should_escalate: meta.should_escalate,
                decision_quality: this.evaluateDecisionQuality(decision)
            }
        };
    }

    private evaluateDecisionQuality(decision: Decision): 'high' | 'medium' | 'low' {
        const { strategy_analysis, flow_decision } = decision;

        let qualityScore = 0;
        if (strategy_analysis.relevant_guidelines.length > 0) qualityScore += 0.3;
        if (flow_decision.confidence > 0.7) qualityScore += 0.3;
        if (strategy_analysis.opportunities.length > 0 || strategy_analysis.risk_factors.length > 0) {
            qualityScore += 0.2;
        }
        if (flow_decision.reasoning.length > 20) qualityScore += 0.2;

        if (qualityScore >= 0.8) return 'high';
        if (qualityScore >= 0.5) return 'medium';
        return 'low';
    }

    private generateFallbackResponse(error: any): AgentResponse {
        return {
            message: "I apologize, but I'm having trouble processing your message right now. Could you please rephrase or try again?",
            action_taken: 'error_fallback',
            reasoning: `System error: ${error?.message || 'Unknown error'}`,
            confidence: 0.1,
            context_updates: {
                last_error: error?.message || 'Unknown error',
                error_timestamp: new Date().toISOString(),
                fallback_used: true
            },
            suggested_next_user_action: 'rephrase_or_retry',
            meta: {
                session_stage: 'error_recovery',
                user_sentiment: 'unknown',
                should_escalate: true,
                decision_quality: 'low'
            }
        };
    }

    getSessionInsights(context: SessionContext): any {
        return {
            stage: context.user_inputs.session_stage || 'unknown',
            sentiment: context.user_inputs.user_sentiment || 'unknown',
            goal_progress: context.user_inputs.goal_progress || 'unknown',
            guidelines_adherence: context.user_inputs.guidelines_considered?.length || 0,
            decision_quality: context.user_inputs.decision_quality || 'unknown',
            escalation_needed: context.user_inputs.escalation_needed || false
        };
    }
}