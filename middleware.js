import { NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = '7322193975:AAHuE-RMKOah6-b9LZYMJ8CFnS84xdc_KvM';
const TELEGRAM_CHAT_ID = '-1002370596410';

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public') ||
    pathname === '/denied'
  ) {
    return NextResponse.next();
  }

  const ip = req.ip || req.headers.get('x-forwarded-for')?.split(',')[0] || '0.0.0.0';
  const userAgent = req.headers.get('user-agent') || 'Unknown';

  try {
    const response = await fetch('https://bad-defender-production.up.railway.app/api/detect_bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, user_agent: userAgent })
    });

    if (!response.ok) {
      console.error('API call failed with status:', response.status);
      const deniedUrl = req.nextUrl.clone();
      deniedUrl.pathname = '/denied';
      return NextResponse.redirect(deniedUrl);
    }

    const data = await response.json();
    const flags = data.details;

    const suspiciousFlags = {
      "Bot UA": flags.isBotUserAgent,
      "Scraper ISP": flags.isScraperISP,
      "IP Abuse": flags.isIPAbuser,
      "Traffic Spike": flags.isSuspiciousTraffic,
      "Data Center ASN": flags.isDataCenterASN
    };

    const triggeredReasons = Object.entries(suspiciousFlags)
      .filter(([_, val]) => val)
      .map(([key]) => key);

    const isSuspicious = triggeredReasons.length > 0;

    if (isSuspicious) {
      const isp = flags?.isp || 'Unknown';
      const asn = flags?.asn || 'Unknown';

      const message = `
🚨 <b>Bot Blocked</b>
🔍 <b>IP:</b> ${ip}
🏢 <b>ISP:</b> ${isp}
🏷️ <b>ASN:</b> ${asn}
🧠 <b>Reason(s):</b> ${triggeredReasons.join(', ')}
🕵️‍♂️ <b>User-Agent:</b> ${userAgent}
      `;

      try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML',
          }),
        });
      } catch (telegramError) {
        console.error('Failed to send Telegram alert:', telegramError);
      }

      const deniedUrl = req.nextUrl.clone();
      deniedUrl.pathname = '/denied';
      return NextResponse.redirect(deniedUrl);
    }

  } catch (error) {
    console.error('Bot detection error:', error);
    const deniedUrl = req.nextUrl.clone();
    deniedUrl.pathname = '/denied';
    return NextResponse.redirect(deniedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
