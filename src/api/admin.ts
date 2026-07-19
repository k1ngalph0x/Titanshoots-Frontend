import { api } from "./client";

export interface Admin {
  id: number;
  username: string;
}
export interface AdminCapacity {
  gun_category_id: number;
  total_guns: number;
  booked: number;
  available: number;
}
export interface AdminSession {
  id: number;
  starts_at: string;
  is_active: boolean;
  capacities: AdminCapacity[];
}

export async function fetchAdminSessions(): Promise<AdminSession[]> {
  const { data } = await api.get<AdminSession[]>("/admin/sessions");
  return data;
}

export async function updateGroupDiscount(
  discountId: number,
  discountRupees: number,
) {
  const { data } = await api.patch(`/admin/group-discounts/${discountId}`, {
    discount_rupees: discountRupees,
  });
  return data;
}
export async function createGroupDiscount(
  numPeople: number,
  discountRupees: number,
) {
  const { data } = await api.post("/admin/group-discounts", {
    num_people: numPeople,
    discount_rupees: discountRupees,
  });
  return data;
}

export async function createAdminSession(
  startsAt: string,
  capacities: { gun_category_id: number; total_guns: number }[],
) {
  const { data } = await api.post("/admin/sessions", {
    starts_at: startsAt,
    capacities,
  });
  return data;
}
export async function updateAdminSession(
  id: number,
  payload: {
    starts_at?: string;
    is_active?: boolean;
    capacities?: { gun_category_id: number; total_guns: number }[];
  },
) {
  const { data } = await api.patch(`/admin/sessions/${id}`, payload);
  return data;
}

export interface AuditEntry {
  id: number;
  admin_user_id: number;
  action: string;
  target_type: string;
  target_id: number | null;
  details: Record<string, any> | null;
  created_at: string;
}
export async function fetchAuditLog(
  limit = 50,
  offset = 0,
): Promise<AuditEntry[]> {
  const { data } = await api.get<AuditEntry[]>("/admin/audit-log", {
    params: { limit, offset },
  });
  return data;
}

export async function createUpiBooking(input: {
  plan_id: number;
  scheduled_at: string;
  customer_phone: string;
  num_people: number;
  customer_name: string;
  customer_age: number;
  id_type: "aadhaar" | "pan" | "other";
  id_verified: boolean;
  consent_given: boolean;
}): Promise<any> {
  return (await api.post("/admin/bookings/upi", input)).data;
}

export interface BookingItem {
  id: number;
  public_token: string;
  customer_phone: string;
  customer_name: string;
  customer_age: number;
  id_type: string;
  id_verified: boolean;
  consent_given: boolean;
  num_people: number;
  state: string;
  payment_method: string;
  amount_paise: number;
  scheduled_at: string;
  gun_category_name: string;
  shot_count: number;
  created_at: string;
  confirmed_at: string | null;
}
export async function fetchBookings(params: {
  state?: string;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<BookingItem[]> {
  const { data } = await api.get<BookingItem[]>("/admin/bookings", { params });
  return data;
}
export async function verifyBooking(
  id: number,
  verified: boolean,
): Promise<BookingItem> {
  const { data } = await api.patch<BookingItem>(
    `/admin/bookings/${id}/verify`,
    { id_verified: verified },
  );
  return data;
}

export async function createCashBooking(input: {
  scheduled_at: string;
  plan_id: number;
  num_people: number;
  customer_name: string;
  customer_phone: string;
  customer_age: number;
  id_type: "aadhaar" | "pan" | "other";
  id_verified: boolean;
  consent_given: boolean;
}): Promise<BookingItem> {
  const { data } = await api.post<BookingItem>("/admin/bookings/cash", input);
  return data;
}

export interface AdminPlan {
  id: number;
  gun_category_id: number;
  shot_count: number;
  price_paise: number;
  discount_percent: number;
  discounted_price_paise: number;
  is_active: boolean;
}
export interface AdminCategory {
  id: number;
  name: string;
  is_active: boolean;
  plans: AdminPlan[];
}

export interface Analytics {
  days: number;
  revenue_paise: number;
  games: number;
  players: number;
  by_method: Record<string, { count: number; revenue_paise: number }>;
  by_category: {
    category: string;
    games: number;
    players: number;
    revenue_paise: number;
  }[];
  daily: { day: string; revenue_paise: number; games: number }[];
}
export async function fetchAnalytics(days = 30): Promise<Analytics> {
  const { data } = await api.get<Analytics>("/admin/analytics", {
    params: { days },
  });
  return data;
}

export async function fetchAdminCatalog(): Promise<AdminCategory[]> {
  const { data } = await api.get<AdminCategory[]>("/admin/catalog");
  return data;
}
export async function createCategory(name: string) {
  return (await api.post("/admin/gun-categories", { name })).data;
}
export async function updateCategory(id: number, name: string) {
  return (await api.patch(`/admin/gun-categories/${id}`, { name })).data;
}
export async function deleteCategory(id: number) {
  return api.delete(`/admin/gun-categories/${id}`);
}
export async function createPlan(
  categoryId: number,
  shotCount: number,
  priceRupees: number,
  discountPercent: number,
) {
  return (
    await api.post("/admin/plans", {
      gun_category_id: categoryId,
      shot_count: shotCount,
      price_rupees: priceRupees,
      discount_percent: discountPercent,
    })
  ).data;
}
export async function updatePlan(
  id: number,
  payload: {
    shot_count?: number;
    price_rupees?: number;
    discount_percent?: number;
  },
) {
  return (await api.patch(`/admin/plans/${id}`, payload)).data;
}
export async function deletePlan(id: number) {
  return api.delete(`/admin/plans/${id}`);
}
