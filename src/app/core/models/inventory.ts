export type ReservationStatus = 'RESERVED' | 'CONFIRMED' | 'RELEASED';

export interface Inventory {
  id: string;
  product_id: string;
  available_quantity: number;
  reserved_quantity: number;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryResponse {
  success: true;
  message?: string;
  data: Inventory;
}
