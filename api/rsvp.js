/**
 * Vercel Serverless Function for wedding RSVP.
 * Set RESEND_API_KEY, RSVP_TO_EMAIL, and RSVP_FROM_EMAIL in Vercel project settings.
 * No guest information is stored in this function; Resend delivers an email to the hosts.
 */
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Please submit the RSVP form.' });
  }
  const { RESEND_API_KEY, RSVP_TO_EMAIL, RSVP_FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY || !RSVP_TO_EMAIL || !RSVP_FROM_EMAIL) {
    return res.status(503).json({ error: 'RSVP is not configured yet. Please contact the wedding hosts.' });
  }
  const d = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body) } catch { return null } })() : req.body;
  if (!d || typeof d !== 'object') return res.status(400).json({ error: 'Please check your RSVP details.' });
  if (d.website) return res.status(200).json({ ok: true }); // honeypot
  const clean = (v, max) => typeof v === 'string' ? v.trim().slice(0, max) : '';
  const name = clean(d.name, 100), attendance = clean(d.attendance, 10);
  const event = clean(d.event, 16), guests = Number(d.guests);
  const phone = clean(d.phone, 30), wishes = clean(d.wishes, 600);
  if (!name || !['yes', 'no'].includes(attendance) || !['nikkah','reception','both','none'].includes(event) || !Number.isInteger(guests) || guests < 1 || guests > 6) {
    return res.status(400).json({ error: 'Please complete your name and attendance details.' });
  }
  const eventNames = { nikkah:'Nikkah · 8 Nov', reception:'Reception · 9 Nov', both:'Both celebrations', none:'Not attending' };
  const text = [
    'NEW WEDDING RSVP — Rana & Sadique', '',
    `Name: ${name}`, `Attendance: ${attendance === 'yes' ? 'Yes, attending' : 'Unable to attend'}`,
    `Event: ${eventNames[event]}`, `Guests (including respondent): ${guests === 6 ? '6 or more' : guests}`,
    `Phone: ${phone || 'Not shared'}`, `Wishes: ${wishes || 'None'}`, '',
    'Sent from the Rana & Sadique wedding invitation website.'
  ].join('\n');
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method:'POST',
      headers:{ 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type':'application/json' },
      body: JSON.stringify({ from: RSVP_FROM_EMAIL, to: [RSVP_TO_EMAIL], subject:`Wedding RSVP: ${name} — ${attendance === 'yes' ? 'Attending' : 'Unable to attend'}`, text })
    });
    if (!r.ok) {
      console.error('Resend failed:', r.status); // no guest data in log
      return res.status(502).json({ error: 'We could not deliver the RSVP. Please try again or contact the hosts.' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('RSVP delivery network error');
    return res.status(502).json({ error: 'Network issue while sending your RSVP. Please retry.' });
  }
};
