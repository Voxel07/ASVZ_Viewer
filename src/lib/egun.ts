export interface EgunItem {
    id: string;
    egun_id: number;
    title: string;
    user: string;
    price: number;
    buy_now_price: number;
    bids: number;
    listing_type: 'auction' | 'fixed';
    condition: string;
    seller_type: string;
    url: string;
    image_url: string;
    ends_at: string;
    active: boolean;
    first_seen: string;
    last_seen: string;
    previous_price: number;
    price_change: number;
    buy_now_change: number;
    last_price_change: string;
}

export interface EgunPrice {
    id: string;
    timestamp: string;
    price: number;
    buy_now_price: number;
}

export interface EgunFilters {
    title: string;
    seller: string;
    id: string;
    min: string;
    max: string;
    status: 'active' | 'inactive' | 'all';
    type: string;
    condition: string;
    sellerType: string;
    change: 'all' | 'changed' | 'down' | 'up' | 'buy-down' | 'buy-up';
    changedSince: string;
    sort: 'newest' | 'ending' | 'price-asc' | 'price-desc' | 'reduction';
}

export const defaultEgunFilters: EgunFilters = {
    title: '', seller: '', id: '', min: '', max: '', status: 'active', type: '',
    condition: '', sellerType: '', change: 'all', changedSince: '', sort: 'newest',
};

export function filterEgun(items: EgunItem[], filters: EgunFilters) {
    const results = items.filter(item => {
        if (filters.status !== 'all' && item.active !== (filters.status === 'active')) return false;
        if (!item.title.toLowerCase().includes(filters.title.trim().toLowerCase())) return false;
        if (!item.user.toLowerCase().includes(filters.seller.trim().toLowerCase())) return false;
        if (filters.id.trim() && String(item.egun_id) !== filters.id.trim()) return false;
        if (filters.min !== '' && item.price < Number(filters.min)) return false;
        if (filters.max !== '' && item.price > Number(filters.max)) return false;
        if (filters.type === 'buy-now' ? item.buy_now_price <= 0 : filters.type && item.listing_type !== filters.type) return false;
        if (filters.condition && item.condition !== filters.condition) return false;
        if (filters.sellerType && item.seller_type !== filters.sellerType) return false;
        if (filters.change === 'changed' && !item.last_price_change) return false;
        if (filters.change === 'down' && item.price_change >= 0) return false;
        if (filters.change === 'up' && item.price_change <= 0) return false;
        if (filters.change === 'buy-down' && item.buy_now_change >= 0) return false;
        if (filters.change === 'buy-up' && item.buy_now_change <= 0) return false;
        if (filters.changedSince && (!item.last_price_change || new Date(item.last_price_change).getTime() < new Date(filters.changedSince).getTime())) return false;
        return true;
    });
    return results.sort((a, b) => {
        switch (filters.sort) {
            case 'price-asc': return a.price - b.price;
            case 'price-desc': return b.price - a.price;
            case 'reduction': return a.price_change - b.price_change;
            case 'ending': return new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime();
            default: return new Date(b.first_seen).getTime() - new Date(a.first_seen).getTime();
        }
    });
}

export function egunLink(id: number) {
    return `https://www.egun.de/item/${id}`;
}

export function egunImage(url: string) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' && parsed.hostname === 'www.egun.de' ? url : undefined;
    } catch { return undefined; }
}
