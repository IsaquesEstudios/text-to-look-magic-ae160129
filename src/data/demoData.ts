/**
 * Mock data for the demo account.
 * This data is ONLY shown to the demo user (isDemoUser === true)
 * and never touches the database.
 */

export const DEMO_PROPERTY_HOUSE = {
  id: "demo-house-001",
  title: "Colonial Revival — Tampa, FL",
  type: "house",
  location: "Tampa, FL",
  state_code: "FL",
  status: "in_progress",
  cover_image_url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80",
  estimated_auction_value: 35000,
  estimated_renovation_cost: 25000,
  estimated_sale_value: 95000,
  estimated_return_pct: 58,
  purchase_price: 35000,
  share_price: 1000,
  total_shares: 60,
  available_shares: 0,
  default_tax_rate: 6,
  created_by: "demo",
  created_at: "2025-08-15T10:00:00Z",
  updated_at: "2025-08-15T10:00:00Z",
};

export const DEMO_PROPERTY_LAND = {
  id: "demo-land-001",
  title: "Terreno 2.5 Acres — Ocala, FL",
  type: "land",
  location: "Ocala, FL",
  state_code: "FL",
  status: "in_progress",
  cover_image_url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80",
  estimated_auction_value: 8000,
  estimated_renovation_cost: 2000,
  estimated_sale_value: 18000,
  estimated_return_pct: 80,
  purchase_price: 8000,
  share_price: 500,
  total_shares: 20,
  available_shares: 0,
  default_tax_rate: 6,
  created_by: "demo",
  created_at: "2025-09-01T10:00:00Z",
  updated_at: "2025-09-01T10:00:00Z",
};

export const DEMO_PROPERTIES = [DEMO_PROPERTY_HOUSE, DEMO_PROPERTY_LAND];

export const DEMO_SHARES = [
  {
    id: "demo-share-001",
    user_id: "demo",
    property_id: DEMO_PROPERTY_HOUSE.id,
    quantity: 10,
    amount_paid: 10000,
    investment_plan: "standard",
    purchased_at: "2025-08-20T14:00:00Z",
    properties: DEMO_PROPERTY_HOUSE,
  },
  {
    id: "demo-share-002",
    user_id: "demo",
    property_id: DEMO_PROPERTY_LAND.id,
    quantity: 5,
    amount_paid: 2500,
    investment_plan: "standard",
    purchased_at: "2025-09-05T14:00:00Z",
    properties: DEMO_PROPERTY_LAND,
  },
];

export const DEMO_CREDIT_TRANSACTIONS = [
  {
    id: "demo-tx-001",
    created_at: "2025-08-18T09:30:00Z",
    type: "deposit",
    amount: 15000,
    description: "$15,000.00",
  },
  {
    id: "demo-tx-002",
    created_at: "2025-08-20T14:00:00Z",
    type: "auction_deposit",
    amount: 10000,
    description: "Colonial Revival — Tampa, FL",
  },
  {
    id: "demo-tx-003",
    created_at: "2025-09-05T14:00:00Z",
    type: "auction_deposit",
    amount: 2500,
    description: "Terreno 2.5 Acres — Ocala, FL",
  },
  {
    id: "demo-tx-004",
    created_at: "2025-10-01T10:00:00Z",
    type: "profit",
    amount: 800,
    description: "$800.00 — Retorno parcial",
  },
];

export const DEMO_MESSAGES_HOUSE = [
  {
    id: "demo-msg-001",
    property_id: DEMO_PROPERTY_HOUSE.id,
    user_id: "admin",
    content: "A reforma do telhado foi concluída com sucesso. Próxima etapa: pintura interna e externa.",
    media_url: null,
    media_type: null,
    created_at: "2025-09-10T15:00:00Z",
  },
  {
    id: "demo-msg-002",
    property_id: DEMO_PROPERTY_HOUSE.id,
    user_id: "admin",
    content: "A instalação elétrica está 80% completa. Previsão de conclusão: próxima semana.",
    media_url: null,
    media_type: null,
    created_at: "2025-09-25T11:00:00Z",
  },
  {
    id: "demo-msg-003",
    property_id: DEMO_PROPERTY_HOUSE.id,
    user_id: "admin",
    content: "Pintura externa finalizada! Confira as fotos do progresso.",
    media_url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80",
    media_type: "image",
    created_at: "2025-10-05T09:00:00Z",
  },
];

export const DEMO_MESSAGES_LAND = [
  {
    id: "demo-msg-l01",
    property_id: DEMO_PROPERTY_LAND.id,
    user_id: "admin",
    content: "Levantamento topográfico concluído. Terreno em ótimas condições para desenvolvimento.",
    media_url: null,
    media_type: null,
    created_at: "2025-09-20T14:00:00Z",
  },
  {
    id: "demo-msg-l02",
    property_id: DEMO_PROPERTY_LAND.id,
    user_id: "admin",
    content: "Licenças ambientais aprovadas. O terreno está pronto para listagem.",
    media_url: null,
    media_type: null,
    created_at: "2025-10-10T10:00:00Z",
  },
];

export const DEMO_EXPENSES_HOUSE = [
  { id: "demo-exp-001", property_id: DEMO_PROPERTY_HOUSE.id, category: "Telhado", product: "Telhado", quantity: 1, price: 4500, month: "09", tax_rate: 6, state_code: "FL", created_at: "2025-09-05T10:00:00Z" },
  { id: "demo-exp-002", property_id: DEMO_PROPERTY_HOUSE.id, category: "Eletricidade", product: "Eletricidade", quantity: 1, price: 3200, month: "09", tax_rate: 6, state_code: "FL", created_at: "2025-09-15T10:00:00Z" },
  { id: "demo-exp-003", property_id: DEMO_PROPERTY_HOUSE.id, category: "Pintura", product: "Pintura", quantity: 1, price: 2800, month: "10", tax_rate: 6, state_code: "FL", created_at: "2025-10-02T10:00:00Z" },
  { id: "demo-exp-004", property_id: DEMO_PROPERTY_HOUSE.id, category: "Encanamento", product: "Encanamento", quantity: 1, price: 1800, month: "10", tax_rate: 6, state_code: "FL", created_at: "2025-10-08T10:00:00Z" },
];

export const DEMO_EXPENSES_LAND = [
  { id: "demo-exp-l01", property_id: DEMO_PROPERTY_LAND.id, category: "Topografia", product: "Topografia", quantity: 1, price: 1200, month: "09", tax_rate: 0, state_code: null, created_at: "2025-09-18T10:00:00Z" },
  { id: "demo-exp-l02", property_id: DEMO_PROPERTY_LAND.id, category: "Licenças", product: "Licenças", quantity: 1, price: 500, month: "10", tax_rate: 0, state_code: null, created_at: "2025-10-05T10:00:00Z" },
];

export const DEMO_AUCTION = {
  id: "demo-auction-001",
  title: "Leilão Discovery — Edição Primavera 2027",
  description: "Leilão com imóveis selecionados em diversas regiões da Flórida. Prazo estendido para análise.",
  scheduled_start: "2027-06-15T18:00:00Z",
  status: "active",
  visibility: "public",
  created_by: "admin",
  created_at: "2025-10-01T10:00:00Z",
  updated_at: "2025-10-01T10:00:00Z",
};

export const DEMO_AUCTION_ITEMS = [
  {
    id: "demo-ai-001",
    auction_id: DEMO_AUCTION.id,
    title: "Ranch House — Jacksonville, FL",
    type: "casa",
    location: "Jacksonville, FL",
    state_code: "FL",
    status: "available",
    description: "Casa estilo ranch com 3 quartos, 2 banheiros. Ótimo potencial de valorização após reforma.",
    image_url: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80",
    cover_image_url: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80",
    estimated_auction_value: 28000,
    estimated_renovation_cost: 18000,
    estimated_sale_value: 72000,
    estimated_timeline: "4-6 meses",
    gallery_images: null,
    property_id: null,
    properties: null,
    created_at: "2025-10-01T10:00:00Z",
  },
];

export function isDemoPropertyId(id: string): boolean {
  return id.startsWith("demo-");
}

export function getDemoProperty(id: string) {
  return DEMO_PROPERTIES.find((p) => p.id === id) ?? null;
}

export function getDemoMessages(propertyId: string) {
  if (propertyId === DEMO_PROPERTY_HOUSE.id) return DEMO_MESSAGES_HOUSE;
  if (propertyId === DEMO_PROPERTY_LAND.id) return DEMO_MESSAGES_LAND;
  return [];
}

export function getDemoExpenses(propertyId: string) {
  if (propertyId === DEMO_PROPERTY_HOUSE.id) return DEMO_EXPENSES_HOUSE;
  if (propertyId === DEMO_PROPERTY_LAND.id) return DEMO_EXPENSES_LAND;
  return [];
}

/** Property news for dashboard — with unread counts */
export function getDemoPropertyNews() {
  return [
    {
      id: DEMO_PROPERTY_HOUSE.id,
      title: DEMO_PROPERTY_HOUSE.title,
      cover_image_url: DEMO_PROPERTY_HOUSE.cover_image_url,
      status: DEMO_PROPERTY_HOUSE.status,
      unread: 3,
      unreadMessages: 3,
      unreadExpenses: 4,
    },
    {
      id: DEMO_PROPERTY_LAND.id,
      title: DEMO_PROPERTY_LAND.title,
      cover_image_url: DEMO_PROPERTY_LAND.cover_image_url,
      status: DEMO_PROPERTY_LAND.status,
      unread: 2,
      unreadMessages: 2,
      unreadExpenses: 2,
    },
  ];
}
