import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class OpenrouterService {
    private readonly logger = new Logger(OpenrouterService.name);
    private readonly base = process.env.OPENROUTER_API_BASE ?? 'https://openrouter.ai/api/v1';
    private readonly key = process.env.OPENROUTER_API_KEY ?? '';

    async suggestMotivos(params: { nombre: string; descripcion?: string; n?: number }): Promise<string[]> {
        const { nombre, descripcion, n = 5 } = params;

        const prompt = this.buildPrompt(nombre, descripcion, n);

        const body = {
            model: "deepseek/deepseek-chat",
            messages: [
                {
                role: "user",
                content: prompt
                }
            ],
            max_tokens: 150,
            temperature: 0.2
        };


        const res = await fetch(`${this.base}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${this.key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
        });

        if (!res.ok) {
        const text = await res.text();
        this.logger.error(`OpenRouter error: ${res.status} ${text}`);
        throw new Error('Error en el servicio de IA (OpenRouter).');
        }

        const json = await res.json();

        const rawText = json?.choices?.[0]?.message?.content ?? "";

        const motivos = this.parseMotivos(rawText);
        return motivos;
    }

    private buildPrompt(nombre: string, descripcion = '', n = 5) {
        return `
    Eres un asistente especializado en odontología. 
    Dado un servicio dental con nombre y descripción, sugiere ${n} motivos de consulta comunes y breves (2–6 palabras). 
    Responde SOLO la lista, cada motivo en una línea sin numeración.

    Servicio: "${nombre}"
    Descripción: "${descripcion}"
        `;
    }

    private parseMotivos(text: string): string[] {
        const parts = text
        .split(/\r?\n|,|;|•|·|−|–|—| - /)
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => s.replace(/^\d+[\).\-\s]*/, '').trim())
        .filter(Boolean);

        const seen = new Set<string>();
        const out: string[] = [];

        for (const p of parts) {
        const lower = p.toLowerCase();
        if (!seen.has(lower)) {
            seen.add(lower);
            out.push(this.normalizeMotivo(p));
        }
        }

        return out;
    }

    private normalizeMotivo(s: string) {
        s = s.trim();
        return s.charAt(0).toUpperCase() + s.slice(1);
    }
}
