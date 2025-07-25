import type { LanguageModelV2Middleware, LanguageModelV2Prompt } from '@ai-sdk/provider';

interface SourceChunk {
    id: string;
    content: string;
    metadata?: Record<string, any>;
}

function getLastUserMessageText({ prompt }: { prompt: LanguageModelV2Prompt }): string | null {
    if (Array.isArray(prompt)) {
        const lastMessage = prompt
            .slice()
            .reverse()
            .find(msg => msg.role === 'user');
        return lastMessage?.content?.toString() ?? null;
    }
    return null;
}

function findSources({ text }: { text: string }): SourceChunk[] {
    return [
        {
            id: 'doc1',
            content: `Information about ${text}: This is a sample document.`,
            metadata: { title: `Sample Doc 1`, created_at: '2025-07-25' },
        },
        {
            id: 'doc2',
            content: `More details on ${text}: Additional context here.`,
            metadata: { title: `Sample Doc 2`, created_at: '2025-07-24' },
        },
    ];
}

function addToLastUserMessage({ params, text }: { params: any; text: string }) {
    const newPrompt = Array.isArray(params.prompt)
        ? params.prompt.map((msg: { role: string; content: any; }, index: number) => {
            if (msg.role === 'user' && index === params.prompt.length - 1) {
                return { ...msg, content: `${msg.content}\n\n${text}` };
            }
            return msg;
        })
        : params.prompt;

    return { ...params, prompt: newPrompt };
}

export const RagMiddleware: LanguageModelV2Middleware = {
    transformParams: async ({ params }) => {
        const lastUserMessageText = getLastUserMessageText({
            prompt: params.prompt,
        });

        if (lastUserMessageText == null) {
            return params;
        }

        const sources = findSources({ text: lastUserMessageText });

        const markdownDocs = sources.map(chunk => {
            const title = chunk.metadata?.title || `Document ${chunk.id}`;
            const createdAt = chunk.metadata?.created_at || 'Unknown date';
            return `## ${title}\n\n${chunk.content}\n\n**Metadata**:\n- ID: ${chunk.id}\n- Created: ${createdAt}\n`;
        });

        const instruction =
            'Use the following Markdown documents to answer the question:\n\n' +
            markdownDocs.join('\n---\n\n');

        return addToLastUserMessage({ params, text: instruction });
    },
};