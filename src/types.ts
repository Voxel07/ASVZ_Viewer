export interface ASVZUpdate {
    id: string;
    added: number;
    updated: number;
    deleted: number;
    timestamp: string; // ISO date string
    total_items: number;
    total_value: number;
}

export interface ASVZPrice {
    id: string;
    asvz_id: string;
    price: number;
    timestamp: string; // ISO date string
    title?: string;
}

export interface MarketplaceItem {
    id: string;
    asvz_id: string;
    title: string;
    price: number;
    user: string;
    timestamp: string; // ISO date string
    updated: string; // ISO date string
    description?: string;
    url?: string;
}

export interface MarketplaceDeletedItem extends MarketplaceItem {
    deleted_date: string; // ISO date string - Mapped from removeTime
    duration_online?: string; // e.g. "2 days 5 hours" or calculated
    last_available: string; // ISO date
    removeTime: string; // Actual PB field
    _isDeleted?: boolean; // UI Flag
}
