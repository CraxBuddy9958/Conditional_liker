// run.js - Multi-Account Bot v3.0 - TURBO EDITION
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

// ============================================
// ⚡ CONFIG - CHANGE SETTINGS HERE
// ============================================
const CONFIG = {
    ONE_HOUR_MS: 60 * 60 * 1000,
    RESTART_DELAY_MS: 2000,
    MAX_RESTARTS: 10,
    IDLE_TIMEOUT_MS: 60 * 1000,
    PAGE_TIMEOUT: 30000,
    MAIN_LOOP_INTERVAL: 10000,
    PARALLEL_ACCOUNTS: true,
    MAX_CONCURRENT_PAGES: 3,
    
    // 🔥 DELETE_LINKS: true = delete from DB | false = track locally
    DELETE_LINKS: true,
};

function sleep(ms) { 
    return new Promise(resolve => setTimeout(resolve, ms)); 
}

function loadScript(filename) {
    const fullPath = path.join(__dirname, filename);
    return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : null;
}

function prepareStep1Script(scriptContent) {
    if (!scriptContent) return null;
    return scriptContent.replace(
        /const DELETE_LINKS = (true|false);/,
        `const DELETE_LINKS = ${CONFIG.DELETE_LINKS};`
    );
}

function normalizeCookie(c) {
    const cookie = {
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path || '/',
        httpOnly: !!c.httpOnly,
        secure: !!c.secure
    };
    if (c.expirationDate && !c.session) cookie.expires = Math.floor(Number(c.expirationDate));
    if (c.sameSite) {
        const s = String(c.sameSite).toLowerCase();
        if (['lax', 'strict', 'none'].includes(s)) cookie.sameSite = s;
    }
    return cookie;
}

const stats = {
    totalCycles: 0,
    startTime: Date.now(),
    getCyclesPerHour() {
        const hours = (Date.now() - this.startTime) / (60 * 60 * 1000);
        return hours > 0 ? Math.round(this.totalCycles / hours) : 0;
    }
};

async function runSession(account, scripts, sessionId) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🚀 SESSION #${sessionId}: ${account.name}`);
    console.log(`${'='.repeat(50)}`);
    
    let browser = null;
    let page = null;
    let cycleCount = 0;
    let lastActivity = Date.now();
    let sessionStartTime = Date.now();

    try {
        browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--disable-extensions',
                '--no-first-run',
                '--no-default-browser-check',
                '--disable-default-apps',
                '--disable-translate',
                '--disable-sync',
                '--metrics-recording-only',
                '--disable-background-networking',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-site-isolation-trials',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
            ]
        });

        page = await browser.newPage();

        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const resourceType = req.resourceType();
            if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                req.abort();
            } else {
                req.continue();
            }
        });

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1366, height: 768 });

        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            window.chrome = { runtime: {} };
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
        });

        if (Array.isArray(account.cookies) && account.cookies.length) {
            await page.setCookie(...account.cookies.map(normalizeCookie));
            console.log(`[runner] 🍪 Set ${account.cookies.length} cookies`);
        }

        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('Step1') || text.includes('Step2') || text.includes('Liked') || text.includes('Deleted') || text.includes('Tracked')) {
                console.log(`[page] 📜`, text);
                lastActivity = Date.now();
                
                if (text.includes('LIKED!') || text.includes('Liked')) {
                    cycleCount++;
                    stats.totalCycles++;
                    console.log(`[runner] ✅ Cycle #${cycleCount} | Total: ${stats.totalCycles} | Speed: ${stats.getCyclesPerHour()}/hr`);
                }
            }
        });

        page.on('framenavigated', async (frame) => {
            if (frame === page.mainFrame()) {
                const url = frame.url();
                console.log(`[page] 📍`, url);
                lastActivity = Date.now();
                await sleep(300);
                await injectScripts(url);
            }
        });

        async function injectScripts(url) {
            try {
                const isThreadsPage = /https:\/\/craxpro\.to\/threads\//.test(url);
                const isPostThreadPage = url.includes("craxpro.to/forums/") && url.includes("post-thread");

                if (isThreadsPage && scripts.step2) {
                    console.log('[runner] 🎯 THREAD → Step2 (Like)');
                    await sleep(500);
                    await page.addScriptTag({ content: scripts.step2 });
                } else if (!isPostThreadPage && scripts.step1) {
                    const modeText = CONFIG.DELETE_LINKS ? 'DELETE MODE' : 'TRACK MODE';
                    console.log(`[runner] 🎯 GENERAL → Step1 (${modeText})`);
                    await sleep(500);
                    await page.addScriptTag({ content: scripts.step1 });
                }
            } catch (e) {
                console.log('[runner] ⚠️ Inject error:', e.message.substring(0, 60));
            }
        }

        console.log('[runner] 🌐 Loading:', account.startUrl || "https://craxpro.to");
        await page.goto(account.startUrl || "https://craxpro.to", { 
            waitUntil: 'domcontentloaded',
            timeout: CONFIG.PAGE_TIMEOUT 
        });
        console.log('[runner] ✅ Page loaded, running TURBO mode...\n');

        while (Date.now() - sessionStartTime < CONFIG.ONE_HOUR_MS) {
            const elapsed = Math.floor((Date.now() - sessionStartTime) / 60000);
            const idle = Math.floor((Date.now() - lastActivity) / 1000);
            
            if (elapsed % 0.5 < 0.17) {
                console.log(`[runner] ⏰ ${elapsed}min | Cycles: ${cycleCount} | Idle: ${idle}s`);
            }
            
            if (Date.now() - lastActivity > CONFIG.IDLE_TIMEOUT_MS) {
                console.log('[runner] ⚠️ Idle timeout, reloading...');
                await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
                lastActivity = Date.now();
            }
            
            await sleep(CONFIG.MAIN_LOOP_INTERVAL);
        }

    } catch (e) {
        console.log('[runner] 💥 Session error:', e.message.substring(0, 80));
    } finally {
        try { if (page) await page.close(); } catch (e) {}
        try { if (browser) await browser.close(); } catch (e) {}
    }

    return cycleCount;
}

async function runParallel(accounts, scripts) {
    console.log('\n🔥 Running accounts in PARALLEL mode...');
    
    const results = [];
    const batchSize = Math.min(accounts.length, CONFIG.MAX_CONCURRENT_PAGES);
    
    for (let i = 0; i < accounts.length; i += batchSize) {
        const batch = accounts.slice(i, i + batchSize);
        const batchPromises = batch.map((account, idx) => 
            runSession(account, scripts, i + idx + 1)
        );
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
    }
    
    return results;
}

async function runSequential(accounts, scripts) {
    console.log('\n🔁 Running accounts in SEQUENTIAL mode...');
    
    const results = [];
    let sessionId = 0;
    
    for (const account of accounts) {
        sessionId++;
        const cycles = await runSession(account, scripts, sessionId);
        results.push(cycles);
    }
    
    return results;
}

async function main() {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 MULTI-ACCOUNT BOT v3.0 - TURBO EDITION');
    console.log('⚡ Optimized for maximum speed');
    console.log('='.repeat(60) + '\n');

    let accounts;
    if (process.env.ACCOUNTS_JSON) {
        accounts = JSON.parse(process.env.ACCOUNTS_JSON);
    } else if (fs.existsSync('./accounts.json')) {
        accounts = JSON.parse(fs.readFileSync('./accounts.json', 'utf8'));
    } else {
        console.error('[runner] ❌ No accounts found');
        process.exit(1);
    }

    const rawStep1 = loadScript('step1_v4.js');
    const scripts = {
        step1: prepareStep1Script(rawStep1),
        step2: loadScript('step2_v4.js'),
    };

    console.log('⚙️ ═════════════════════════════════════════════════');
    console.log(`👥 Accounts: ${accounts.length}`);
    console.log(`📜 Scripts: step1=${scripts.step1?'✓':'✗'} step2=${scripts.step2?'✓':'✗'}`);
    console.log(`🔧 Execution: ${CONFIG.PARALLEL_ACCOUNTS ? 'PARALLEL' : 'SEQUENTIAL'}`);
    console.log(`📊 Max concurrent browsers: ${CONFIG.MAX_CONCURRENT_PAGES}`);
    console.log(`🗑️ Delete links from DB: ${CONFIG.DELETE_LINKS ? 'YES (DELETE MODE)' : 'NO (TRACK MODE)'}`);
    console.log('⚙️ ═════════════════════════════════════════════════\n');

    const totalStartTime = Date.now();
    let restarts = 0;

    while (Date.now() - totalStartTime < CONFIG.ONE_HOUR_MS && restarts < CONFIG.MAX_RESTARTS) {
        try {
            const results = CONFIG.PARALLEL_ACCOUNTS 
                ? await runParallel(accounts, scripts)
                : await runSequential(accounts, scripts);
            
            const totalCycles = results.reduce((a, b) => a + b, 0);
            
            if (totalCycles === 0) {
                restarts++;
                console.log(`\n[runner] 📊 Restarts: ${restarts}/${CONFIG.MAX_RESTARTS}`);
                await sleep(CONFIG.RESTART_DELAY_MS);
            } else {
                restarts = 0;
            }
        } catch (e) {
            console.error('[runner] 💥 Batch error:', e.message);
            restarts++;
            await sleep(CONFIG.RESTART_DELAY_MS);
        }
    }

    const totalMinutes = Math.floor((Date.now() - totalStartTime) / 60000);
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ FINISHED`);
    console.log(`📊 Total cycles: ${stats.totalCycles}`);
    console.log(`📊 Total time: ${totalMinutes} minutes`);
    console.log(`📊 Average speed: ${stats.getCyclesPerHour()} cycles/hour`);
    console.log(`${'='.repeat(60)}\n`);
}

main().catch(e => {
    console.error('[runner] 💥 FATAL:', e.message);
    process.exit(1);
});
