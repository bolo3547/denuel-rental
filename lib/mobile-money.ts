/**
 * Mobile Money Integration for Zambia
 * Supports Airtel Money and MTN MoMo
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Airtel Money Configuration
const AIRTEL_CLIENT_ID = process.env.AIRTEL_CLIENT_ID;
const AIRTEL_CLIENT_SECRET = process.env.AIRTEL_CLIENT_SECRET;
const AIRTEL_API_URL = process.env.AIRTEL_API_URL || 'https://openapiuat.airtel.africa';
const AIRTEL_PIN = process.env.AIRTEL_PIN;

// MTN MoMo Configuration
const MTN_SUBSCRIPTION_KEY = process.env.MTN_SUBSCRIPTION_KEY;
const MTN_API_USER = process.env.MTN_API_USER;
const MTN_API_KEY = process.env.MTN_API_KEY;
const MTN_API_URL = process.env.MTN_API_URL || 'https://sandbox.momodeveloper.mtn.com';
const MTN_CALLBACK_URL = process.env.MTN_CALLBACK_URL;

// Dev mode detection
const DEV_MODE = !AIRTEL_CLIENT_ID && !MTN_SUBSCRIPTION_KEY;

// Maximum allowed amount
const MAX_AMOUNT = 50000;

export type MobileMoneyProvider = 'AIRTEL' | 'MTN';

export interface PaymentRequest {
  phone: string;
  amount: number;
  reference: string;
  description?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  provider: MobileMoneyProvider;
  message?: string;
}

export interface PaymentStatus {
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'EXPIRED';
  transactionId: string;
  provider: MobileMoneyProvider;
  amount?: number;
  reason?: string;
}

/**
 * Detect mobile money provider from phone number
 * Airtel: 097x, 077x
 * MTN: 096x, 076x
 */
export function detectProvider(phone: string): MobileMoneyProvider | null {
  const cleaned = phone.replace(/\D/g, '');
  const lastDigits = cleaned.slice(-9);
  
  const prefix = lastDigits.substring(0, 3);
  
  if (prefix === '097' || prefix === '077') {
    return 'AIRTEL';
  } else if (prefix === '096' || prefix === '076') {
    return 'MTN';
  }
  
  return null;
}

/**
 * Format phone number for mobile money APIs
 */
function formatPhoneForAPI(phone: string, provider: MobileMoneyProvider): string {
  const cleaned = phone.replace(/\D/g, '');
  
  // Get last 9 digits
  const number = cleaned.slice(-9);
  
  // Format based on provider requirements
  if (provider === 'AIRTEL') {
    return '260' + number; // Airtel expects 260xxxxxxxxx
  } else {
    return '260' + number; // MTN also expects 260xxxxxxxxx
  }
}

/**
 * Validate payment amount
 */
function validateAmount(amount: number): boolean {
  return amount > 0 && amount <= MAX_AMOUNT;
}

/**
 * Airtel Money: Get OAuth2 access token
 */
async function getAirtelAccessToken(): Promise<string | null> {
  try {
    const response = await axios.post(
      `${AIRTEL_API_URL}/auth/oauth2/token`,
      {
        client_id: AIRTEL_CLIENT_ID,
        client_secret: AIRTEL_CLIENT_SECRET,
        grant_type: 'client_credentials',
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );
    
    return response.data?.access_token || null;
  } catch (error) {
    console.error('Airtel OAuth error:', error);
    return null;
  }
}

/**
 * Airtel Money: Initiate collection
 */
async function collectViaAirtel(request: PaymentRequest): Promise<PaymentResponse> {
  try {
    const token = await getAirtelAccessToken();
    if (!token) {
      return { success: false, provider: 'AIRTEL', message: 'Failed to authenticate' };
    }
    
    const transactionId = uuidv4();
    const phone = formatPhoneForAPI(request.phone, 'AIRTEL');
    
    const response = await axios.post(
      `${AIRTEL_API_URL}/merchant/v1/payments/`,
      {
        reference: request.reference,
        subscriber: {
          country: 'ZM',
          currency: 'ZMW',
          msisdn: phone,
        },
        transaction: {
          amount: request.amount,
          country: 'ZM',
          currency: 'ZMW',
          id: transactionId,
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Country': 'ZM',
          'X-Currency': 'ZMW',
        },
        timeout: 30000,
      }
    );
    
    const status = response.data?.status?.code;
    
    if (status === 'TS' || status === '200') {
      return {
        success: true,
        transactionId: response.data?.data?.transaction?.id || transactionId,
        provider: 'AIRTEL',
      };
    }
    
    return {
      success: false,
      provider: 'AIRTEL',
      message: response.data?.status?.message || 'Transaction failed',
    };
  } catch (error: any) {
    console.error('Airtel collection error:', error);
    return {
      success: false,
      provider: 'AIRTEL',
      message: error?.response?.data?.status?.message || 'Payment request failed',
    };
  }
}

/**
 * MTN MoMo: Request to Pay
 */
async function collectViaMTN(request: PaymentRequest): Promise<PaymentResponse> {
  try {
    const transactionId = uuidv4();
    const phone = formatPhoneForAPI(request.phone, 'MTN');
    
    // Encode credentials for Basic auth
    const credentials = Buffer.from(`${MTN_API_USER}:${MTN_API_KEY}`).toString('base64');
    
    const response = await axios.post(
      `${MTN_API_URL}/collection/v1_0/requesttopay`,
      {
        amount: request.amount.toString(),
        currency: 'ZMW',
        externalId: request.reference,
        payer: {
          partyIdType: 'MSISDN',
          partyId: phone,
        },
        payerMessage: request.description || 'DENUEL Payment',
        payeeNote: request.description || 'Payment for DENUEL services',
      },
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'X-Reference-Id': transactionId,
          'X-Target-Environment': process.env.MTN_ENVIRONMENT || 'sandbox',
          'Ocp-Apim-Subscription-Key': MTN_SUBSCRIPTION_KEY,
          'Content-Type': 'application/json',
          ...(MTN_CALLBACK_URL ? { 'X-Callback-Url': MTN_CALLBACK_URL } : {}),
        },
        timeout: 30000,
      }
    );
    
    if (response.status === 202) {
      return {
        success: true,
        transactionId,
        provider: 'MTN',
      };
    }
    
    return { success: false, provider: 'MTN', message: 'Request failed' };
  } catch (error: any) {
    console.error('MTN collection error:', error);
    return {
      success: false,
      provider: 'MTN',
      message: error?.response?.data?.message || 'Payment request failed',
    };
  }
}

/**
 * Check Airtel Money payment status
 */
async function checkAirtelStatus(transactionId: string): Promise<PaymentStatus> {
  try {
    const token = await getAirtelAccessToken();
    if (!token) {
      return { status: 'FAILED', transactionId, provider: 'AIRTEL', reason: 'Auth failed' };
    }
    
    const response = await axios.get(
      `${AIRTEL_API_URL}/standard/v1/payments/${transactionId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Country': 'ZM',
          'X-Currency': 'ZMW',
        },
        timeout: 10000,
      }
    );
    
    const status = response.data?.data?.transaction?.status;
    
    if (status === 'TS' || status === 'SUCCESS') {
      return {
        status: 'SUCCESSFUL',
        transactionId,
        provider: 'AIRTEL',
        amount: parseFloat(response.data?.data?.transaction?.amount || '0'),
      };
    } else if (status === 'TF' || status === 'FAILED') {
      return {
        status: 'FAILED',
        transactionId,
        provider: 'AIRTEL',
        reason: response.data?.status?.message,
      };
    }
    
    return { status: 'PENDING', transactionId, provider: 'AIRTEL' };
  } catch (error) {
    console.error('Airtel status check error:', error);
    return { status: 'FAILED', transactionId, provider: 'AIRTEL', reason: 'Status check failed' };
  }
}

/**
 * Check MTN MoMo payment status
 */
async function checkMTNStatus(transactionId: string): Promise<PaymentStatus> {
  try {
    const credentials = Buffer.from(`${MTN_API_USER}:${MTN_API_KEY}`).toString('base64');
    
    const response = await axios.get(
      `${MTN_API_URL}/collection/v1_0/requesttopay/${transactionId}`,
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'X-Target-Environment': process.env.MTN_ENVIRONMENT || 'sandbox',
          'Ocp-Apim-Subscription-Key': MTN_SUBSCRIPTION_KEY,
        },
        timeout: 10000,
      }
    );
    
    const status = response.data?.status;
    
    if (status === 'SUCCESSFUL') {
      return {
        status: 'SUCCESSFUL',
        transactionId,
        provider: 'MTN',
        amount: parseFloat(response.data?.amount || '0'),
      };
    } else if (status === 'FAILED') {
      return {
        status: 'FAILED',
        transactionId,
        provider: 'MTN',
        reason: response.data?.reason,
      };
    } else if (status === 'PENDING') {
      return { status: 'PENDING', transactionId, provider: 'MTN' };
    }
    
    return { status: 'EXPIRED', transactionId, provider: 'MTN' };
  } catch (error) {
    console.error('MTN status check error:', error);
    return { status: 'FAILED', transactionId, provider: 'MTN', reason: 'Status check failed' };
  }
}

/**
 * Unified payment collection function
 * Auto-detects provider and routes to appropriate API
 */
export async function collectPayment(request: PaymentRequest): Promise<PaymentResponse> {
  // Validate amount
  if (!validateAmount(request.amount)) {
    return {
      success: false,
      provider: 'AIRTEL', // Default
      message: `Invalid amount. Must be between 1 and ${MAX_AMOUNT}`,
    };
  }
  
  // Detect provider
  const provider = detectProvider(request.phone);
  
  if (!provider) {
    return {
      success: false,
      provider: 'AIRTEL',
      message: 'Unable to detect mobile money provider from phone number',
    };
  }
  
  // Dev mode fallback
  if (DEV_MODE) {
    console.log('💰 [DEV MODE] Payment collection would be initiated:');
    console.log('  Provider:', provider);
    console.log('  Phone:', request.phone);
    console.log('  Amount: K', request.amount);
    console.log('  Reference:', request.reference);
    
    return {
      success: true,
      transactionId: `DEV-${uuidv4()}`,
      provider,
      message: 'Dev mode - simulated success',
    };
  }
  
  // Route to appropriate provider
  if (provider === 'AIRTEL' && AIRTEL_CLIENT_ID) {
    return collectViaAirtel(request);
  } else if (provider === 'MTN' && MTN_SUBSCRIPTION_KEY) {
    return collectViaMTN(request);
  }
  
  return {
    success: false,
    provider,
    message: `${provider} Money not configured`,
  };
}

/**
 * Check payment status
 */
export async function checkPaymentStatus(
  transactionId: string,
  provider: MobileMoneyProvider
): Promise<PaymentStatus> {
  // Dev mode fallback
  if (DEV_MODE) {
    console.log('💰 [DEV MODE] Payment status check:', transactionId);
    return { status: 'SUCCESSFUL', transactionId, provider };
  }
  
  if (provider === 'AIRTEL') {
    return checkAirtelStatus(transactionId);
  } else {
    return checkMTNStatus(transactionId);
  }
}

export default {
  collectPayment,
  checkPaymentStatus,
  detectProvider,
};
