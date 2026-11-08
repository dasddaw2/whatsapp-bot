const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// تخزين حالات العملاء مؤقتًا
const userStates = new Map();

// إعداد العميل ليعمل بسلاسة على السيرفرات السحابية
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: 'chromium', // استخدام متصفح السيرفر المثبت مسبقاً
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--single-process'
        ],
    }
});

// عرض QR Code في سجلات السيرفر (Logs)
client.on('qr', (qr) => {
    console.log('امسح رمز الـ QR التالي للربط:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ البوت يعمل وجاهز بكامل المزايا في السحاب!');
});

// الاستماع للرسائل الواردة
client.on('message', async msg => {
    if (msg.from.includes('@g.us') || msg.from === 'status@broadcast') return;

    const senderId = msg.from;
    const text = msg.body.trim();
    const currentState = userStates.get(senderId);

    // الترحيب والقائمة الرئيسية
    if (['مرحبا', 'السلام عليكم', 'hi', 'hello', 'مراحب', '0', 'قائمة', 'منيو'].includes(text.toLowerCase())) {
        userStates.delete(senderId);
        await msg.reply(
            'أهلاً بك في خدمة العملاء! يرجى اختيار الرقم المناسب لطلبك:\n\n' +
            '1️⃣ استفسارات\n' +
            '2️⃣ ارجاع او استبدال (تحويل لموظف)\n' +
            '3️⃣ شكوى\n\n' +
            '*(يرجى إرسال رقم الخيار فقط)*'
        );
        return;
    }

    // الاختيار من القائمة
    if (!currentState) {
        if (text === '1') {
            userStates.set(senderId, 'WAITING_FOR_INQUIRY');
            await msg.reply('💬 **قسم الاستفسارات:**\nتفضل بكتابة استفسارك وسيقوم الموظف بالرد عليك هنا في أقرب وقت.');
        } 
        else if (text === '2') {
            userStates.set(senderId, 'WAITING_FOR_EXCHANGE');
            await msg.reply('🔄 **قسم الإرجاع والبدل:**\nيرجى تزويدنا برقم الطلب وسبب الاستبدال أو الإرجاع، وسيتابع معك الموظف المختص فوراً.');
        } 
        else if (text === '3') {
            userStates.set(senderId, 'WAITING_FOR_COMPLAINT');
            await msg.reply('⚠️ **قسم الشكاوى:**\nنأسف لذلك. يرجى كتابة تفاصيل الشكوى كاملة وسيتم مراجعتها من قِبل الإدارة بأسرع وقت.');
        } 
        else {
            await msg.reply('عذراً، لم أفهم طلبك. يرجى اختيار رقم من القائمة:\n\n1️⃣ استفسارات\n2️⃣ ارجاع او استبدال\n3️⃣ شكوى\n\nأو اكتب "مرحبا" لإظهار القائمة.');
        }
        return;
    }

    // استقبال التفاصيل
    if (currentState) {
        await msg.reply('✅ تم استلام رسالتك وتوجيهها للمختص بنجاح.\nيرجى الانتظار قليلاً وسيتم الرد عليك من قِبلنا على نفس المحادثة.');
        userStates.delete(senderId);
        return;
    }
});

client.initialize();
