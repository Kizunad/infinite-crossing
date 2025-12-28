import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateWorld } from '@/lib/agents/world-generator-agent';

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes for world generation

const GenerateRequestSchema = z.object({
    theme: z.string().min(1, 'Theme is required'),
    average_power: z.number().min(1).max(100).default(8),
    mystery_level: z.number().min(1).max(100).default(50),
    resource_scarcity: z.number().min(1).max(100).default(50),
});

export async function POST(req: Request) {
    try {
        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json(
                { error_message: 'Invalid JSON body' },
                { status: 400 }
            );
        }

        const parsed = GenerateRequestSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error_message: 'Invalid request: ' + parsed.error.message },
                { status: 400 }
            );
        }

        console.log('[GenerateAPI] Generating world with theme:', parsed.data.theme);

        const generatedWorld = await generateWorld({
            theme: parsed.data.theme,
            average_power: parsed.data.average_power,
            mystery_level: parsed.data.mystery_level,
            resource_scarcity: parsed.data.resource_scarcity,
        });

        return NextResponse.json({
            success: true,
            world: generatedWorld,
        });
    } catch (error) {
        console.error('[GenerateAPI] Error:', error);
        return NextResponse.json(
            { error_message: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
