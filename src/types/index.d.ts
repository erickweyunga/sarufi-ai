export type LLMProvider = 'openai' | 'anthropic' | 'google';

export type AnthropicModel =
    | 'claude-3-5-sonnet-20241022'
    | 'claude-3-5-haiku-20241022'
    | 'claude-3-opus-20240229'
    | 'claude-3-sonnet-20240229'
    | 'claude-3-haiku-20240307';

export type OpenAIModel =
    | 'gpt-4-turbo-preview'
    | 'gpt-4'
    | 'gpt-3.5-turbo'
    | 'gpt-4o'
    | 'gpt-4o-mini';

export type GoogleModel =
    | 'gemini-1.5-pro-latest'
    | 'gemini-2.5-flash';

export type ModelName = AnthropicModel | OpenAIModel | GoogleModel | string;

export interface Strategy {
    name: string;
    domain: string;

    primary_goal: string;
    secondary_goals: string[];

    llm_provider: LLMProvider;
    model: ModelName;

    personality: {
        tone: string;
        style: string;
        pace: string;
    };

    system_prompt?: string;

    guidelines: {
        must_do: string[];
        must_not_do: string[];
        prefer_to_do: string[];
        avoid_doing: string[];
    };

    knowledge: {
        key_info: string[];
        common_questions: string[];
        escalation_triggers: string[];
    };
    // conversation_flow: Record<any, any>
}

export interface SessionContext {
    session_id: string;
    user_id: string;
    strategy_name: string;

    status: 'active' | 'paused' | 'completed' | 'escalated';
    current_goal: string;
    messages_count: number;

    user_inputs: Record<string, any>;
    user_profile: {
        detected_intent?: string;
        sentiment?: 'positive' | 'neutral' | 'negative';
        expertise_level?: 'beginner' | 'intermediate' | 'expert';
    };

    messages: Array<{
        id: string;
        role: 'user' | 'assistant' | 'system';
        content: string;
        timestamp: Date;
        toolCalls?: any[];
        toolResults?: any[];
    }>;

    agent_memory: {
        last_action: string;
        reasoning_history: string[];
        failed_attempts: string[];
        successful_patterns: string[];
    };

    created_at: Date;
    updated_at: Date;
}

export interface AgentResponse {
    message: string;
    action_taken: string;
    reasoning: string;
    confidence: number;
    context_updates: Record<string, any>;
    suggested_next_user_action?: string;
    meta?: {
        session_stage: string;
        user_sentiment: string;
        should_escalate: boolean;
        decision_quality: 'high' | 'medium' | 'low';
    };
}

export interface Session {
    session_id: string;
    status: 'started';
    initial_message: string;
    context: SessionContext;
}

export interface Output {
    message: string;
    session_id: string;
    agent_reasoning?: string;
    suggested_actions?: string[];
    session_status: 'active' | 'completed' | 'escalated';
}

export interface Stats {
    total_sessions: number;
    active_sessions: number;
    completed_sessions: number;
    average_session_length: number;
    strategies_registered: number;
    total_messages_processed: number;
}
