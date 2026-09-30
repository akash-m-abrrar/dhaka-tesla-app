export type PaymentMethod = "CASH" | "TESLAPAY";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface Payment {
  id: string;
  poolMemberId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef: string;
  paidAt: string | null;
  createdAt: string;
}

export interface PassengerPayment extends Payment {
  poolMember: {
    fare: number;
    status: "PENDING" | "PAID" | "CANCELLED";
    pool: { id: string; status: string };
  };
}

export interface DriverPoolPayment {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef: string;
  paidAt: string | null;
  createdAt: string;
  poolMember: {
    id: string;
    passengerId: string;
    fare: number;
    status: "PENDING" | "PAID" | "CANCELLED";
  };
}

export interface CreatePaymentInput {
  method: PaymentMethod;
}
