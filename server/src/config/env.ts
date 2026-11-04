import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Resolve both tsx source and compiled server layouts, independent of the
// process working directory (npm workspace scripts run from server/).
const envCandidates = [
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
];
const envFile = envCandidates.find((candidate) => fs.existsSync(candidate));
if (envFile) dotenv.config({ path: envFile });

export interface AppConfig {
  port: number;
  nodeEnv: string;
  clientUrl: string;
  mongoUri: string;
  jwtSecret: string;
  geminiApiKey: string;
  geminiModel: string;
  googlePlacesApiKey: string;
  geoapifyApiKey: string;
  telegramBotToken: string;
  telegramBotUsername: string;
  telegramWebhookSecret: string;
  whatsappPhoneNumberId: string;
  whatsappAccessToken: string;
  whatsappAppSecret: string;
  whatsappVerifyToken: string;
  defaultCurrency: string;
  outboundMessagingEnabled: boolean;
  maxNegotiationRounds: number;
  vendorsPerTask: number;
  approvalTtlMinutes: number;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || process.env.APP_PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/concierge',
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production_key_12345',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY || '',
  geoapifyApiKey: process.env.GEOAPIFY_API_KEY || '',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME || '',
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || '',
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  whatsappAppSecret: process.env.WHATSAPP_APP_SECRET || '',
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
  defaultCurrency: process.env.DEFAULT_CURRENCY || 'INR',
  outboundMessagingEnabled: process.env.OUTBOUND_MESSAGING_ENABLED !== 'false',
  maxNegotiationRounds: parseInt(process.env.MAX_NEGOTIATION_ROUNDS || '3', 10),
  vendorsPerTask: parseInt(process.env.VENDORS_PER_TASK || '5', 10),
  approvalTtlMinutes: parseInt(process.env.APPROVAL_TTL_MINUTES || '60', 10),
};
