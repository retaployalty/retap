// Email configuration for development and production

export const emailConfig = {
  // Development settings
  development: {
    // Use Inbucket for local email testing
    smtp: {
      host: 'localhost',
      port: 54325,
      secure: false,
    },
    // Email testing interface
    inboxUrl: 'http://localhost:54324',
  },
  
  // Production settings
  production: {
    // Configure your SMTP provider here
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'apikey',
        pass: process.env.SMTP_PASS || process.env.SENDGRID_API_KEY,
      },
    },
  },
};

// Helper function to get current email configuration
export function getEmailConfig() {
  return process.env.NODE_ENV === 'production' 
    ? emailConfig.production 
    : emailConfig.development;
}

// Helper function to check if email testing is available
export function isEmailTestingAvailable() {
  return process.env.NODE_ENV === 'development';
}

// Helper function to get inbox URL for development
export function getInboxUrl() {
  return emailConfig.development.inboxUrl;
} 