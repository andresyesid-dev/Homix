export interface MercadoPagoPaymentData {
  token: string;
  amount: number;
  description?: string;
  installments?: number;
  payment_method_id: string;
  payer: {
    email: string;
    identification?: {
      type: string;
      number: string;
    };
  };
}

export interface MercadoPagoPaymentResponse {
  success: boolean;
  payment?: {
    id: number;
    status: string;
    status_detail: string;
    payment_method_id: string;
    payment_type_id: string;
    transaction_amount: number;
    installments: number;
    payer: {
      email: string;
    };
    date_created: string;
  };
  error?: string;
  details?: any;
}

export interface MercadoPagoBrickConfig {
  initialization: {
    amount: number;
    preferenceId?: string;
  };
  customization?: {
    paymentMethods?: {
      ticket?: string;
      creditCard?: string;
      debitCard?: string;
      mercadoPago?: string;
    };
    visual?: {
      hidePaymentButton?: boolean;
      hideFormTitle?: boolean;
    };
  };
  callbacks?: {
    onReady?: () => void;
    onSubmit?: (data: any) => Promise<void>;
    onError?: (error: any) => void;
  };
}

declare global {
  interface Window {
    MercadoPago: any;
  }
}