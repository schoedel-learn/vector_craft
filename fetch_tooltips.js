import fs from 'fs';
import path from 'path';

const DEEPSEEK_API_KEY = 'sk-0e493ed3180947ea9cb19678e65f4f9d';
const API_URL = 'https://api.deepseek.com/chat/completions';
const delay = ms => new Promise(res => setTimeout(res, ms));

async function fetchTooltips(type, namesList) {
    const prompt = `You are an expert art historian. For the following list of ${type}, provide a historically accurate tooltip description.
REQUIREMENTS:
- Brief description of their style/characteristics.
- MUST end with active time period (e.g., "Active: 1920-1960").
- Concise (about 15-25 words).
- Return ONLY a raw JSON array of objects, with "name" and "tooltip".

LIST OF ${type.toUpperCase()}:
${namesList.join("\n")}
`;

    let retries = 3;
    while (retries > 0) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout
            
            const response = await fetch(API_URL, {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        { role: 'system', content: 'Return only JSON data.' },
                        { role: 'user', content: prompt }
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.1
                })
            });
            clearTimeout(timeout);

            if (!response.ok) throw new Error(`API error ${response.status}`);
            const data = await response.json();
            
            let content = data.choices[0].message.content.trim();
            if (content.startsWith('```json')) content = content.replace(/```json/g, '').replace(/```/g, '').trim();
            
            let parsed = JSON.parse(content);
            if (!Array.isArray(parsed)) {
                const keys = Object.keys(parsed);
                parsed = Object.values(parsed).find(Array.isArray) || parsed[keys[0]];
            }
            if (!Array.isArray(parsed)) throw new Error("Could not extract array");
            return parsed;
        } catch (error) {
            retries--;
            console.error(`Retry left ${retries} for batch starting with ${namesList[0]}. Error: ${error.message}`);
            await delay(1000);
        }
    }
    return namesList.map(name => ({
        name,
        tooltip: `Noted ${type.slice(0, -1)}. Active details pending historical review.`
    }));
}

// Concurrency helper
async function mapConcurrent(items, limit, fn) {
    const results = [];
    let i = 0;
    const execThread = async () => {
        while (i < items.length) {
            const index = i++;
            results[index] = await fn(items[index], index);
        }
    };
    await Promise.all(Array(Math.min(limit, items.length)).fill().map(execThread));
    return results;
}

async function processFile(filePath, type, arrayName) {
    console.log(`Processing ${filePath}...`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Naively extract the array
    const arrayMatch = content.match(/export const [A-Z_]+ = \[\s*([\s\S]*?)\s*\];/);
    if (!arrayMatch) return console.error("Could not find array in file", filePath);
    
    let items;
    try {
        items = eval(`[${arrayMatch[1]}]`);
    } catch(e) {
        return console.error("Failed to eval array:", e.message);
    }
    
    // If it's already an array of objects with tooltips, filter out the ones already done
    const isAlreadyFormatted = typeof items[0] === 'object' && items[0] !== null;
    if (isAlreadyFormatted && items.every(item => item.tooltip)) {
        console.log(`File ${filePath} is already fully processed.`);
        return;
    }
    
    // Extract names assuming they are strings or {name} objects
    const nameList = items.map(item => item.name ? item.name : item);
    console.log(`Found ${nameList.length} items. Using concurrency of 5.`);
    
    const BATCH_SIZE = 50;
    const batches = [];
    for (let i = 0; i < nameList.length; i += BATCH_SIZE) {
        batches.push(nameList.slice(i, i + BATCH_SIZE));
    }
    
    // Process batches concurrently
    const allResults = [];
    const batchOutputs = await mapConcurrent(batches, 5, async (batch, idx) => {
        console.log(`Processing batch ${idx+1}/${batches.length}...`);
        return await fetchTooltips(type, batch);
    });
    
    batchOutputs.forEach(batchRes => allResults.push(...batchRes));
    
    // Formatting
    const finalFormatted = nameList.map(name => {
        const found = allResults.find(r => r.name === name);
        return found ? found : { name, tooltip: `Noted ${type.slice(0, -1)}. Active details pending historical review.` };
    });
    
    const newContent = `export const ${arrayName} = [\n${finalFormatted.map(r => `  { name: ${JSON.stringify(r.name)}, tooltip: ${JSON.stringify(r.tooltip)} }`).join(",\n")}\n];\n`;
    fs.writeFileSync(filePath, newContent);
    console.log(`Successfully updated ${filePath}`);
}

async function main() {
    await processFile(path.join(process.cwd(), 'components/artMovements.ts'), 'art movements', 'ART_MOVEMENTS');
    await processFile(path.join(process.cwd(), 'components/artIllustrators.ts'), 'illustrators', 'ILLUSTRATORS');
}

main().catch(console.error);
