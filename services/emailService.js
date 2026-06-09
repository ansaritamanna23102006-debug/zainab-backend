const nodemailer = require('nodemailer');

/* ── Transporter ──────────────────────────────────────────────────────── */
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/* ── Verify connection on startup (non-fatal) ─────────────────────────── */
transporter.verify((error) => {
  if (error) {
    console.warn('⚠️  Email service warning:', error.message);
  } else {
    console.log('✅ Email service ready');
  }
});

/* ── Shared sender info ───────────────────────────────────────────────── */
const FROM = `"${process.env.FROM_NAME || 'Zainab Clinic'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

/* ══════════════════════════════════════════════════════════════════════ */
/*  APPOINTMENT EMAILS                                                    */
/* ══════════════════════════════════════════════════════════════════════ */

/**
 * Send confirmation email to clinic admin when a new appointment is booked.
 */
const sendAppointmentEmail = async (appointment) => {
  const {
    patientName, phone, age, gender,
    appointmentDate, appointmentTime, symptoms,
  } = appointment;

  const formattedDate = new Date(appointmentDate).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background: #f4f7f6; margin: 0; padding: 0; }
        .wrapper { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header  { background: linear-gradient(135deg, #0F766E, #14B8A6); padding: 32px 40px; color: #fff; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p  { margin: 6px 0 0; opacity: 0.85; font-size: 14px; }
        .body    { padding: 32px 40px; }
        .field   { margin-bottom: 16px; }
        .label   { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; }
        .value   { font-size: 15px; color: #0F172A; font-weight: 600; margin-top: 2px; }
        .badge   { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; background: #E6FFFA; color: #0F766E; }
        .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
        .footer  { background: #f8fafc; padding: 20px 40px; font-size: 12px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>🏥 New Appointment Request</h1>
          <p>A patient has requested a consultation at Zainab Clinic.</p>
        </div>
        <div class="body">
          <div class="field">
            <div class="label">Patient Name</div>
            <div class="value">${patientName}</div>
          </div>
          <div class="field">
            <div class="label">Phone Number</div>
            <div class="value">${phone}</div>
          </div>
          <div class="field" style="display:flex; gap:32px;">
            <div>
              <div class="label">Age</div>
              <div class="value">${age || 'Not specified'}</div>
            </div>
            <div>
              <div class="label">Gender</div>
              <div class="value" style="text-transform:capitalize;">${gender || 'Not specified'}</div>
            </div>
          </div>
          <hr class="divider">
          <div class="field">
            <div class="label">Appointment Date</div>
            <div class="value">${formattedDate}</div>
          </div>
          <div class="field">
            <div class="label">Preferred Time</div>
            <div class="value">${appointmentTime}</div>
          </div>
          ${symptoms ? `
          <hr class="divider">
          <div class="field">
            <div class="label">Symptoms / Reason for Visit</div>
            <div class="value" style="font-weight:400; line-height:1.6;">${symptoms}</div>
          </div>` : ''}
          <hr class="divider">
          <div class="field">
            <div class="label">Status</div>
            <div class="badge">Pending</div>
          </div>
        </div>
        <div class="footer">
          Zainab Clinic · Sangam Complex, Ambernath (W) - 421501 · +91 70210 96008
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from:    FROM,
    to:      ADMIN_EMAIL,
    subject: `📋 New Appointment — ${patientName} on ${formattedDate}`,
    html,
  });
};

/* ══════════════════════════════════════════════════════════════════════ */
/*  CONTACT EMAILS                                                        */
/* ══════════════════════════════════════════════════════════════════════ */

/**
 * Send notification email to clinic admin when contact form is submitted.
 */
const sendContactEmail = async (contact) => {
  const { name, email, phone, message } = contact;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background: #f4f7f6; margin: 0; padding: 0; }
        .wrapper { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header  { background: linear-gradient(135deg, #0F172A, #1e293b); padding: 32px 40px; color: #fff; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p  { margin: 6px 0 0; opacity: 0.75; font-size: 14px; }
        .body    { padding: 32px 40px; }
        .field   { margin-bottom: 16px; }
        .label   { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; }
        .value   { font-size: 15px; color: #0F172A; font-weight: 600; margin-top: 2px; }
        .msg-box { background: #f8fafc; border-left: 4px solid #0F766E; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-top: 6px; line-height: 1.7; color: #334155; }
        .footer  { background: #f8fafc; padding: 20px 40px; font-size: 12px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>💬 New Contact Message</h1>
          <p>Someone has submitted the contact form on zainabclinic.com</p>
        </div>
        <div class="body">
          <div class="field">
            <div class="label">Name</div>
            <div class="value">${name}</div>
          </div>
          <div class="field">
            <div class="label">Email</div>
            <div class="value"><a href="mailto:${email}" style="color:#0F766E;">${email}</a></div>
          </div>
          ${phone ? `
          <div class="field">
            <div class="label">Phone</div>
            <div class="value">${phone}</div>
          </div>` : ''}
          <div class="field">
            <div class="label">Message</div>
            <div class="msg-box">${message.replace(/\n/g, '<br>')}</div>
          </div>
        </div>
        <div class="footer">
          Zainab Clinic · Sangam Complex, Ambernath (W) - 421501 · +91 70210 96008
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from:    FROM,
    to:      ADMIN_EMAIL,
    subject: `💬 Contact Form — Message from ${name}`,
    html,
  });
};

module.exports = { sendAppointmentEmail, sendContactEmail };
