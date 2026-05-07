export default async function handler(req, res) {
  // Accept GET (Vercel cron) or POST (manual trigger)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const slot = parseInt(req.query.slot || '1');

  const SMS_MESSAGES = [
    "Hey Dedee! 🚕 Don't forget to book your Wipro cabs for the whole week! Book them now before the window closes! From your lovely boyfriend ❤️",
    "Dedee! 🚨 Second reminder — have you booked your Wipro cabs yet?? Please do it now! From your lovely boyfriend ❤️",
    "DEDEE. 😤 FINAL reminder. WIPRO. CABS. BOOK. NOW. PLEASE. From your lovely boyfriend ❤️",
  ];

  const msg = SMS_MESSAGES[Math.min(slot - 1, 2)];
  const results = [];

  // Send SMS via Twilio
  try {
    const accountSid = process.env.TWILIO_SID;
    const authToken = process.env.TWILIO_AUTH;
    const encoded = new URLSearchParams();
    encoded.append('To', process.env.GF_PHONE);
    encoded.append('From', process.env.TWILIO_PHONE);
    encoded.append('Body', msg);

    const r = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: encoded.toString(),
      }
    );
    const d = await r.json();
    results.push({ sms: d.sid ? 'sent ✅' : ('failed: ' + d.message) });
  } catch (e) {
    results.push({ sms: 'error: ' + e.message });
  }

  // Send Email via nodemailer
  try {
    const nodemailer = (await import('nodemailer')).default;
    const subjects = [
      '🚕 Dedee! Book your Wipro cabs NOW!',
      '🚨 2nd Reminder — Wipro cabs!',
      '😤 FINAL Reminder — Wipro cabs!!',
    ];
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GF_EMAIL,
      subject: subjects[Math.min(slot - 1, 2)],
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; background: #f9f9f9; border-radius: 12px;">
          <h2 style="color: #e53e3e;">🚨 Reminder #${slot} — Cab Booking!</h2>
          <p style="font-size: 16px; color: #333;">Hey Dedee! 💕</p>
          <p style="font-size: 15px; color: #555;">
            You need to book your <strong>Wipro cabs for the entire week</strong> before the window closes!
          </p>
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; border-radius: 6px; margin: 16px 0;">
            ⏰ <strong>Don't wait!</strong> Log in to the Wipro cab portal and book now!
          </div>
          <p style="font-size: 13px; color: #aaa; margin-top: 24px;">
            From your lovely boyfriend ❤️
          </p>
        </div>
      `,
    });
    results.push({ email: 'sent ✅' });
  } catch (e) {
    results.push({ email: 'error: ' + e.message });
  }

  return res.status(200).json({ ok: true, slot, results });
}
