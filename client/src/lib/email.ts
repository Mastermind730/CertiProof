import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationRequestEmail(
  studentEmail: string,
  studentName: string,
  verifierName: string,
  verifierEmail: string,
  certificatePRN: string,
  requestId: string
) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/student`;
  
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: studentEmail,
    subject: '🔔 New Certificate Verification Request - CertiProof',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4f46e5 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #4f46e5; }
            .button { display: inline-block; padding: 12px 30px; background: #4f46e5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 New Verification Request</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${studentName}</strong>,</p>
              
              <p>Someone has requested to verify your certificate. Please review the details below:</p>
              
              <div class="info-box">
                <h3>📋 Request Details</h3>
                <p><strong>Requester Name:</strong> ${verifierName}</p>
                <p><strong>Requester Email:</strong> ${verifierEmail}</p>
                <p><strong>Certificate PRN:</strong> ${certificatePRN}</p>
                <p><strong>Request Time:</strong> ${new Date().toLocaleString()}</p>
              </div>
              
              <p>For security reasons, this verification request requires your approval before the certificate can be viewed.</p>
              
              <p style="text-align: center;">
                <a href="${dashboardUrl}" class="button">Review Request on Dashboard</a>
              </p>
              
              <p>You can approve or reject this request from your student dashboard.</p>
              
              <div class="footer">
                <p>This is an automated email from CertiProof</p>
                <p>If you didn't expect this request, please reject it immediately from your dashboard.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification request email sent to:', studentEmail);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export async function sendVerificationApprovedEmail(
  verifierEmail: string,
  verifierName: string,
  studentName: string,
  certificatePRN: string
) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify?prn=${certificatePRN}`;
  
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: verifierEmail,
    subject: '✅ Certificate Verification Request Approved - CertiProof',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #4f46e5 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Request Approved</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${verifierName}</strong>,</p>
              
              <p>Good news! ${studentName} has approved your verification request for certificate <strong>${certificatePRN}</strong>.</p>
              
              <p style="text-align: center;">
                <a href="${verifyUrl}" class="button">View Certificate</a>
              </p>
              
              <div class="footer">
                <p>This is an automated email from CertiProof</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Approval notification sent to:', verifierEmail);
  } catch (error) {
    console.error('Error sending approval email:', error);
    throw error;
  }
}
