# target: Railway (Docker builder)
FROM node:20-bookworm-slim

# dumb-init يمرّر إشارات الإيقاف لـ Chromium بدل أن تُقتل العمليات معلّقة (zombie processes)
RUN apt-get update && apt-get install -y --no-install-recommends \
      dumb-init \
      chromium \
      ca-certificates \
      fonts-liberation \
      fonts-noto-color-emoji \
      libglib2.0-0 \
      libnss3 \
      libatk1.0-0 \
      libatk-bridge2.0-0 \
      libcups2 \
      libdrm2 \
      libxkbcommon0 \
      libxcomposite1 \
      libxdamage1 \
      libxfixes3 \
      libxrandr2 \
      libgbm1 \
      libasound2 \
      libpango-1.0-0 \
      libcairo2 \
      libatspi2.0-0 \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# طبقة التبعيات منفصلة — تُعاد فقط عند تغيّر package.json، فالبناء أسرع
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

# تشغيل بمستخدم غير root — node موجود جاهزاً في الصورة الرسمية
RUN mkdir -p /app/.wwebjs_auth && chown -R node:node /app
USER node

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
