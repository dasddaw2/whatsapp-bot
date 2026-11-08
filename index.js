// file: index.js  (Node 20)
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: '/app/.wwebjs_auth' }),
    puppeteer: {
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-extensions'
        ]
    }
});

client.on('qr', (qr) => {
    console.log('[QR] امسح الكود من واتساب > الأجهزة المرتبطة');
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
    console.log('[AUTH] تمت المصادقة، جاري التحميل');
});

client.on('ready', () => {
    console.log('✅ العميل جاهز ويستقبل الرسائل');
});

client.on('auth_failure', (msg) => {
    console.error('[AUTH_FAIL]', msg);
});

client.on('disconnected', (reason) => {
    console.warn('[DISCONNECTED]', reason, '— إعادة التهيئة بعد 5 ثوانٍ');
    setTimeout(() => client.initialize().catch(err => {
        console.error('[REINIT_FAIL]', err.message);
    }), 5000);
});

// منطق الرسائل
client.on('message', async (msg) => {
    if (msg.body === 'ping') {
        await msg.reply('pong');
    }
});

// إيقاف نظيف عند إعادة النشر — يغلق Chromium بدل تركه معلّقاً
const shutdown = async (signal) => {
    console.log(`[${signal}] إيقاف نظيف`);
    try {
        await client.destroy();
    } catch (err) {
        console.error('[SHUTDOWN_ERR]', err.message);
    }
    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
    console.error('[UNHANDLED]', err);
});

client.initialize().catch(err => {
    console.error('[INIT_FAIL]', err.message);
    process.exit(1);
});
