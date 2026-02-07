import nodemailer from 'nodemailer';

const isConfigured =
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

const FROM = process.env.SMTP_FROM || 'DENUEL Rental <noreply@denuelrental.com>';

export async function sendEmail(to: string, subject: string, html: string) {
  if (!transporter) {
    console.log(`[EMAIL-DEV] To: ${to}`);
    console.log(`[EMAIL-DEV] Subject: ${subject}`);
    console.log(`[EMAIL-DEV] Body: ${html.substring(0, 200)}...`);
    return;
  }
  await transporter.sendMail({ from: FROM, to, subject, html });
}

export async function sendWelcomeEmail(name: string, email: string) {
  await sendEmail(
    email,
    'Welcome to DENUEL Rental!',
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="text-align:center;padding:20px;background:#2563eb;border-radius:12px 12px 0 0;">
        <h1 style="color:white;margin:0;">Welcome to DENUEL</h1>
      </div>
      <div style="padding:30px;background:#f9fafb;border-radius:0 0 12px 12px;">
        <p>Hi <strong>${name || 'there'}</strong>,</p>
        <p>Welcome to Zambia's #1 Rental Marketplace! Here's what you can do:</p>
        <ul>
          <li>Browse thousands of properties across Zambia</li>
          <li>Book transport for your move</li>
          <li>Hire verified service providers</li>
          <li>List your own properties as a landlord</li>
        </ul>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://denuelrental.com'}/rent"
           style="display:inline-block;background:#2563eb;color:white;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:15px;">
          Start Searching
        </a>
        <p style="margin-top:20px;color:#6b7280;font-size:14px;">
          Need help? Contact us at support@denuelrental.com
        </p>
      </div>
    </div>`
  );
}

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  await sendEmail(
    email,
    'Reset Your DENUEL Password',
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="text-align:center;padding:20px;background:#2563eb;border-radius:12px 12px 0 0;">
        <h1 style="color:white;margin:0;">Password Reset</h1>
      </div>
      <div style="padding:30px;background:#f9fafb;border-radius:0 0 12px 12px;">
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <a href="${resetLink}"
           style="display:inline-block;background:#2563eb;color:white;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:bold;margin:20px 0;">
          Reset Password
        </a>
        <p style="color:#6b7280;font-size:14px;">This link expires in 1 hour.</p>
        <p style="color:#6b7280;font-size:14px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    </div>`
  );
}

export async function sendBookingConfirmationEmail(
  email: string,
  propertyTitle: string,
  dates: { start: string; end: string }
) {
  await sendEmail(
    email,
    'Booking Confirmed!',
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="text-align:center;padding:20px;background:#16a34a;border-radius:12px 12px 0 0;">
        <h1 style="color:white;margin:0;">Booking Confirmed</h1>
      </div>
      <div style="padding:30px;background:#f9fafb;border-radius:0 0 12px 12px;">
        <p>Great news! Your booking has been confirmed:</p>
        <div style="background:white;padding:20px;border-radius:8px;border:1px solid #e5e7eb;margin:15px 0;">
          <p><strong>Property:</strong> ${propertyTitle}</p>
          <p><strong>Move-in:</strong> ${dates.start}</p>
          <p><strong>Move-out:</strong> ${dates.end}</p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://denuelrental.com'}/dashboard"
           style="display:inline-block;background:#2563eb;color:white;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:bold;">
          View Dashboard
        </a>
      </div>
    </div>`
  );
}

export async function sendApplicationStatusEmail(
  email: string,
  propertyTitle: string,
  status: 'APPROVED' | 'REJECTED'
) {
  const isApproved = status === 'APPROVED';
  await sendEmail(
    email,
    `Application ${isApproved ? 'Approved' : 'Update'} - ${propertyTitle}`,
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <div style="text-align:center;padding:20px;background:${isApproved ? '#16a34a' : '#dc2626'};border-radius:12px 12px 0 0;"> 
        <h1 style="color:white;margin:0;">Application ${isApproved ? 'Approved!' : 'Update'}</h1>
      </div>
      <div style="padding:30px;background:#f9fafb;border-radius:0 0 12px 12px;">
        <p>Your application for <strong>${propertyTitle}</strong> has been <strong>${status.toLowerCase()}</strong>.</p>
        ${isApproved
          ? '<p>Congratulations! The landlord has approved your application. You can now proceed with booking.</p>'
          : '<p>Unfortunately your application was not approved this time. There are many great properties waiting for you!</p>'
        }
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://denuelrental.com'}/${isApproved ? 'dashboard' : 'rent'}"
           style="display:inline-block;background:#2563eb;color:white;padding:12px 30px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:15px;">
          ${isApproved ? 'Go to Dashboard' : 'Browse More Properties'}
        </a>
      </div>
    </div>`
  );
}