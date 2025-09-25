export type CustomerInfo = {
  firstName: string; lastName: string;
  cell?: string; email?: string;
  address?: string; city?: string; state?: string; zip?: string;
  driversLicense?: string; dlState?: string; dlExpires?: string;
  dob?: string; coBuyer?: boolean; notes?: string;
};

export type DealInfo = {
  stock?: string; year?: string; make?: string; model?: string; vin?: string;
  newOrUsed?: "New" | "Used";
  // Add your existing pencil fields too (price, dp, term, rate, taxes, fees, etc.)
};

export type PencilState = {
  deal: DealInfo;
  customer: CustomerInfo;
};
