import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? "http://localhost:8000",
  withCredentials: true,
});

export interface Plan {
  id: number;
  shot_count: number;
  price_paise: number;
  price_display: string;
  discount_percent: number;
  discounted_price_paise: number;
  discounted_display: string;
}

export interface Category {
  id: number;
  name: string;
  plans: Plan[];
}
export interface GroupDiscount {
  num_people: number;
  discount_paise: number;
  discount_display: string;
}
export interface Catalog {
  categories: Category[];
  group_discounts: GroupDiscount[];
}

export interface PublicCapacity {
  gun_category_id: number;
  available: number;
}
export interface PublicSession {
  id: number;
  starts_at: string;
  capacities: PublicCapacity[];
}

export interface BookingCreateInput {
  plan_id: number;
  scheduled_at: string;
  num_people: number;
  customer_name: string;
  customer_phone: string;
  customer_age: number;
  id_type: "aadhaar" | "pan" | "other";
  consent_given: boolean;
}

export interface Checkout {
  booking_token: string;
  razorpay_key_id: string;
  razorpay_order_id: string;
  amount_paise: number;
  currency: string;
}
export interface BookingStatus {
  token: string;
  state: string;
  scheduled_at: string;
  num_people: number;
  amount_paise: number;
  customer_name: string;
  id_verified: boolean;
}

export async function createBooking(
  input: BookingCreateInput,
): Promise<Checkout> {
  const { data } = await api.post<Checkout>("/bookings", input);
  return data;
}
export async function fetchBookingStatus(
  token: string,
): Promise<BookingStatus> {
  const { data } = await api.get<BookingStatus>(`/bookings/${token}`);
  return data;
}

export async function fetchSessions(): Promise<PublicSession[]> {
  const { data } = await api.get<PublicSession[]>("/sessions");
  return data;
}

export async function fetchCatalog(): Promise<Catalog> {
  const { data } = await api.get<Catalog>("/plans");
  return data;
}
