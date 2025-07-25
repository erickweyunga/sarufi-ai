import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import type { Strategy } from '../types';
import type { LanguageModel } from 'ai';

const MODEL_CONFIGS = {
    anthropic: {
        'claude-3-5-sonnet-20241022': () => anthropic('claude-3-5-sonnet-20241022'),
        'claude-3-5-haiku-20241022': () => anthropic('claude-3-5-haiku-20241022'),
        'claude-3-opus-20240229': () => anthropic('claude-3-opus-20240229'),
        default: () => anthropic('claude-3-5-sonnet-20241022')
    },
    google: {
        'gemini-1.5-pro-latest': () => google('gemini-1.5-pro-latest'),
        'gemini-2.5-flash': () => google('gemini-2.5-flash'),
        'gemini-pro': () => google('gemini-pro'),
        default: () => google('gemini-2.5-flash')
    }
} as const;

/**
 * @function getLanguageModel
 * @param strategy - The strategy object containing the `llm_provider` and `model` configuration.
 * @returns A configured LanguageModel instance from the specified provider.
 * @throws {Error} If an unknown LLM provider is specified and no fallback is available.
 * @description This function retrieves and initializes the appropriate Large Language Model (LLM)
 * based on the `llm_provider` and `model` defined in the provided strategy.
 * It supports models from Anthropic and Google currently. If a specified model is not found
 * for a given provider, it falls back to a default model for that provider.
 * If the `llm_provider` itself is unknown, it defaults to Anthropic's default model.
 */
export function getLanguageModel(strategy: Strategy): LanguageModel {
    const provider = strategy.llm_provider || 'google';
    const modelName = strategy.model;

    const providerConfig = MODEL_CONFIGS[provider as keyof typeof MODEL_CONFIGS];

    if (!providerConfig) {
        console.warn(`Unknown LLM provider: ${provider}, falling back to google's default model.`);
        return MODEL_CONFIGS.google.default();
    }

    if (modelName && modelName in providerConfig) {
        return providerConfig[modelName as keyof typeof providerConfig]();
    }

    return providerConfig.default();
}
