import { Agent } from "../agent";
import type { Strategy, SessionContext, Session, Output, Stats, AgentResponse } from "../types";

/**
 * @class Sarufi
 * @description Manages strategies, AI interaction sessions, and agents to facilitate dynamic AI-driven interactions.
 * It handles the lifecycle of AI sessions, from starting and processing messages to ending and providing analytics.
 */
export class Sarufi {
    private strategies = new Map<string, Strategy>();
    private sessions = new Map<string, SessionContext>();
    private agents = new Map<string, Agent>();
    private sessionStats = {
        totalSessions: 0,
        activeSessions: 0,
        completedSessions: 0,
        totalMessages: 0,
        totalSessionDuration: 0,
        errorCount: 0
    };

    /**
     * @constructor
     * @description Initializes a new instance of the Sarufi system.
     */
    constructor() {
    }

    /**
     * @method registerStrategy
     * @param strategy - The strategy to be registered with the Sarufi system.
     * @description Registers a new strategy, making it available for starting AI interaction sessions.
     * Throws an error if the strategy is invalid or lacks a name.
     */
    registerStrategy(strategy: Strategy): void {
        if (!strategy.name) {
            throw new Error('Strategy must have a name');
        }


        this.validateStrategy(strategy);

        this.strategies.set(strategy.name, strategy);
        this.agents.set(strategy.name, new Agent(strategy));

    }

    /**
     * @method getStrategy
     * @param name - The name of the strategy to retrieve.
     * @returns The strategy object if found, otherwise undefined.
     * @description Retrieves a registered strategy by its name.
     */
    getStrategy(name: string): Strategy | undefined {
        return this.strategies.get(name);
    }

    /**
     * @method listStrategies
     * @returns An array of names of all registered strategies.
     * @description Returns a list of all strategy names currently registered in the Sarufi system.
     */
    listStrategies(): string[] {
        return Array.from(this.strategies.keys());
    }

    /**
     * @method unregisterStrategy
     * @param name - The name of the strategy to unregister.
     * @returns True if the strategy was successfully unregistered, false otherwise.
     * @description Removes a strategy and its associated agent from the Sarufi system.
     */
    unregisterStrategy(name: string): boolean {
        const removed = this.strategies.delete(name);
        this.agents.delete(name);
        return removed;
    }

    /**
     * @method startSession
     * @param userId - The ID of the user initiating the AI session.
     * @param strategyName - The name of the strategy to use for this AI session.
     * @param initialContext - Optional initial context data for the AI session.
     * @param tools - Optional tools to pass to the language model.
     * @returns A promise that resolves to the new AI interaction session details.
     * @description Starts a new AI interaction session for a given user with a specified strategy.
     * If an active session already exists for the user, it will be ended first.
     */
    async startSession(
        userId: string,
        strategyName: string,
        initialContext?: Record<string, any>,
        tools: any = {}
    ): Promise<Session> {

        const strategy = this.strategies.get(strategyName);
        if (!strategy) {
            throw new Error(`Strategy '${strategyName}' not found`);
        }

        const agent = this.agents.get(strategyName);
        if (!agent) {
            throw new Error(`Agent for strategy '${strategyName}' not found`);
        }

        const existingSession = this.findSessionByUser(userId);
        if (existingSession) {
            await this.endSession(existingSession.session_id);
        }

        const sessionId = this.generateSarufiSessionId();
        const context: SessionContext = {
            session_id: sessionId,
            user_id: userId,
            strategy_name: strategyName,
            status: 'active',
            current_goal: 'initial_engagement',
            messages_count: 0,
            user_inputs: initialContext || {},
            user_profile: {},
            messages: [],
            agent_memory: {
                last_action: 'session_started',
                reasoning_history: [],
                failed_attempts: [],
                successful_patterns: []
            },
            created_at: new Date(),
            updated_at: new Date()
        };

        this.sessions.set(sessionId, context);
        this.sessionStats.totalSessions++;
        this.sessionStats.activeSessions++;

        const initialResponse: AgentResponse = await agent.processPrompt(
            '[SESSION_STARTED]',
            context,
            tools
        );

        context.messages.push({
            id: this.generateMessageId(),
            role: 'assistant',
            content: initialResponse.message,
            timestamp: new Date()
        });

        this.updateSessionContext(sessionId, initialResponse.context_updates);

        const session: Session = {
            session_id: sessionId,
            status: 'started',
            initial_message: initialResponse.message,
            context: context
        };

        return session;
    }

    /**
     * @method sendMessage
     * @param sessionId - The ID of the AI interaction session.
     * @param message - The message to process within the AI session.
     * @param tools - Optional tools to pass to the language model.
     * @returns A promise that resolves to the Sarufi system's response.
     * @description Processes a message within an active AI interaction session,
     * triggering AI generation and updating session context.
     */
    async sendMessage(sessionId: string, message: string, tools: any = {}): Promise<Output> {

        const context = this.sessions.get(sessionId);
        if (!context) {
            throw new Error(`AI Session '${sessionId}' not found`);
        }

        if (context.status !== 'active') {
            throw new Error(`AI Session '${sessionId}' is not active`);
        }

        const agent = this.agents.get(context.strategy_name);
        if (!agent) {
            throw new Error(`Agent for strategy '${context.strategy_name}' not found`);
        }

        try {
            context.messages.push({
                id: this.generateMessageId(),
                role: 'user',
                content: message,
                timestamp: new Date()
            });
            context.messages_count++;
            this.sessionStats.totalMessages++;

            const agentResponse: AgentResponse = await agent.processPrompt(message, context, tools);

            context.messages.push({
                id: this.generateMessageId(),
                role: 'assistant',
                content: agentResponse.message,
                timestamp: new Date()
            });
            context.messages_count++;

            this.updateSessionContext(sessionId, agentResponse.context_updates);

            if (agentResponse.meta?.should_escalate) {
                context.status = 'escalated';
                this.sessionStats.activeSessions--;
            }

            const response: Output = {
                message: agentResponse.message,
                session_id: sessionId,
                agent_reasoning: agentResponse.reasoning,
                session_status: context.status,
                suggested_actions: agentResponse.suggested_next_user_action ? [agentResponse.suggested_next_user_action] : undefined
            };

            return response;

        } catch (error) {
            this.sessionStats.errorCount++;
            console.error(`Error processing message:`, error);

            return {
                message: "I'm sorry, I encountered an issue. Could you please try again?",
                session_id: sessionId,
                session_status: 'active',
                agent_reasoning: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * @method endSession
     * @param sessionId - The ID of the AI interaction session to end.
     * @returns A promise that resolves to true if the AI session was successfully ended, false otherwise.
     * @description Ends an active AI interaction session, updating its status and session statistics.
     */
    async endSession(sessionId: string): Promise<boolean> {
        const context = this.sessions.get(sessionId);
        if (!context) {
            return false;
        }

        context.status = 'completed';
        context.updated_at = new Date();

        this.sessionStats.activeSessions--;
        this.sessionStats.completedSessions++;
        this.sessionStats.totalSessionDuration += context.updated_at.getTime() - context.created_at.getTime();

        return true;
    }

    /**
     * @method getSarufiSession
     * @param sessionId - The ID of the AI session to retrieve.
     * @returns The AI session context if found, otherwise undefined.
     * @description Retrieves the context for a specific AI interaction session.
     */
    getSarufiSession(sessionId: string): SessionContext | undefined {
        return this.sessions.get(sessionId);
    }

    /**
     * @method getActiveSarufiSessions
     * @returns An array of active AI session contexts.
     * @description Returns all currently active AI interaction sessions.
     */
    getActiveSarufiSessions(): SessionContext[] {
        return Array.from(this.sessions.values()).filter(c => c.status === 'active');
    }

    /**
     * @method getUserSarufiSessions
     * @param userId - The ID of the user whose AI sessions are to be retrieved.
     * @returns An array of AI session contexts associated with the given user ID.
     * @description Returns all AI interaction sessions associated with a specific user.
     */
    getUserSarufiSessions(userId: string): SessionContext[] {
        return Array.from(this.sessions.values()).filter(c => c.user_id === userId);
    }

    /**
     * @method getStats
     * @returns Overall Sarufi system statistics.
     * @description Provides aggregate statistics about all AI interaction sessions managed by the Sarufi system.
     */
    getStats(): Stats {
        const activeSessions = this.getActiveSarufiSessions().length;
        const averageSessionDuration = this.sessionStats.completedSessions > 0
            ? this.sessionStats.totalSessionDuration / this.sessionStats.completedSessions
            : 0;

        return {
            total_sessions: this.sessionStats.totalSessions,
            active_sessions: activeSessions,
            completed_sessions: this.sessionStats.completedSessions,
            average_session_length: this.sessionStats.totalMessages / Math.max(this.sessionStats.totalSessions, 1),
            strategies_registered: this.strategies.size,
            total_messages_processed: this.sessionStats.totalMessages
        };
    }

    /**
     * @method getSarufiSessionAnalytics
     * @param sessionId - The ID of the AI session for which to retrieve analytics.
     * @returns Analytics data for the specified AI session, or null if not found.
     * @description Provides detailed analytics for a specific AI interaction session, including insights from the agent.
     */
    getSarufiSessionAnalytics(sessionId: string) {
        const context = this.sessions.get(sessionId);
        if (!context) {
            return null;
        }

        const agent = this.agents.get(context.strategy_name);
        // This method call still uses 'getSarufiSessionInsights' from the Agent class
        const insights = agent?.getSessionInsights(context);

        return {
            session_id: sessionId,
            duration: context.updated_at.getTime() - context.created_at.getTime(),
            message_count: context.messages_count,
            current_stage: context.user_inputs.session_stage,
            user_sentiment: context.user_inputs.user_sentiment,
            goal_progress: context.user_inputs.goal_progress,
            escalation_needed: context.user_inputs.escalation_needed,
            decision_quality: context.user_inputs.decision_quality,
            insights: insights
        };
    }

    /**
     * @method getStrategyPerformance
     * @param strategyName - The name of the strategy for which to retrieve performance data.
     * @returns Performance metrics for the specified strategy within the Sarufi system.
     * @description Calculates and returns performance metrics for a given strategy based on its associated AI sessions.
     */
    getStrategyPerformance(strategyName: string) {
        const sessions = Array.from(this.sessions.values())
            .filter(c => c.strategy_name === strategyName);

        const totalSessions = sessions.length;
        const completedSessions = sessions.filter(c => c.status === 'completed').length;
        const escalatedSessions = sessions.filter(c => c.status === 'escalated').length;
        const averageMessages = sessions.reduce((sum, c) => sum + c.messages_count, 0) / totalSessions;

        return {
            strategy_name: strategyName,
            total_sessions: totalSessions,
            completion_rate: totalSessions > 0 ? completedSessions / totalSessions : 0,
            escalation_rate: totalSessions > 0 ? escalatedSessions / totalSessions : 0,
            average_messages: averageMessages || 0,
            performance_score: this.calculatePerformanceScore(sessions)
        };
    }

    /**
     * @private
     * @method validateStrategy
     * @param strategy - The strategy object to validate.
     * @description Validates the essential properties of a strategy. Throws an error if any required property is missing.
     */
    private validateStrategy(strategy: Strategy): void {
        if (!strategy.name) {
            throw new Error('Strategy must have a name');
        }
        if (!strategy.primary_goal) {
            throw new Error('Strategy must have a primary_goal');
        }
        if (!strategy.domain) {
            throw new Error('Strategy must have a domain');
        }
        if (!strategy.personality) {
            throw new Error('Strategy must have personality settings');
        }
        if (!strategy.guidelines) {
            throw new Error('Strategy must have guidelines');
        }
    }

    /**
     * @private
     * @method findSessionByUser
     * @param userId - The ID of the user.
     * @returns The active AI session context for the user if found, otherwise undefined.
     * @description Finds an active AI interaction session associated with a specific user ID.
     */
    private findSessionByUser(userId: string): SessionContext | undefined {
        return Array.from(this.sessions.values()).find(c =>
            c.user_id === userId && c.status === 'active'
        );
    }

    /**
     * @private
     * @method updateSessionContext
     * @param sessionId - The ID of the AI session to update.
     * @param updates - An object containing the context updates.
     * @description Updates the user inputs within a specific AI session's context.
     */
    private updateSessionContext(sessionId: string, updates: Record<string, any>): void {
        const context = this.sessions.get(sessionId);
        if (context) {
            Object.assign(context.user_inputs, updates);
            context.updated_at = new Date();
        }
    }

    /**
     * @private
     * @method generateSarufiSessionId
     * @returns A unique string ID for a new AI session.
     * @description Generates a unique ID for an AI interaction session.
     */
    private generateSarufiSessionId(): string {
        return `sarufi_sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * @private
     * @method generateMessageId
     * @returns A unique string ID for a new message.
     * @description Generates a unique ID for a message within an AI session.
     */
    private generateMessageId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * @private
     * @method calculatePerformanceScore
     * @param sessions - An array of AI session contexts.
     * @returns A performance score based on AI session outcomes.
     * @description Calculates a performance score for a set of AI sessions based on their status and user inputs.
     */
    private calculatePerformanceScore(sessions: SessionContext[]): number {
        if (sessions.length === 0) return 0;

        let score = 0;
        for (const sess of sessions) {
            if (sess.status === 'completed') score += 1;
            if (sess.user_inputs.decision_quality === 'high') score += 0.5;
            if (sess.user_inputs.user_sentiment === 'positive') score += 0.3;
            if (sess.status === 'escalated') score -= 0.5;
        }

        return Math.max(0, Math.min(1, score / sessions.length));
    }
}