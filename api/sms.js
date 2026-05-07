export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const accountSid = process.env.TWILIO_SID;
  const authToken = process.env.TWILIO_AUTH;
  const fromNumber = process.env.TWILIO_PHONE;
  const toNumber = process.env.GF_PHONE;

  const { message } = req.body;

  const encoded = new URLSearchParams();
  encoded.append('To', toNumber);
  encoded.append('From', fromNumber);
  encoded.append('Body', message);

  try {
    const response = await fetch(
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
    const data = await response.json();
    if (data.sid) {
      return res.status(200).json({ ok: true, sid: data.sid });
    } else {
      return res.status(400).json({ ok: false, error: data.message });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
