import MidtransClient from 'midtrans-client';

// Initialize Midtrans Snap client
let snap: MidtransClient.Snap | null = null;

export function getSnapClient() {
  if (!snap) {
    snap = new MidtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: process.env.MIDTRANS_SERVER_KEY || '',
      clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
    });
  }
  return snap;
}

export interface TransactionDetails {
  order_id: string;
  gross_amount: number;
}

export interface CustomerDetails {
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
}

export interface ItemDetails {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

export interface TransactionRequest {
  transaction_details: TransactionDetails;
  customer_details: CustomerDetails;
  item_details: ItemDetails[];
  enabled_payments?: string[];
}

export async function createTransaction(transactionRequest: TransactionRequest) {
  try {
    const snap = getSnapClient();
    const transaction = await snap.createTransaction(transactionRequest);
    return {
      success: true,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    };
  } catch (error) {
    console.error('Midtrans transaction creation error:', error);
    return {
      success: false,
      error: 'Failed to create transaction',
    };
  }
}

export function getSnapToken() {
  return process.env.MIDTRANS_CLIENT_KEY || '';
}
