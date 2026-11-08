import { format, formatDistanceStrict } from 'date-fns';
import type { ASVZUpdate, MarketplaceDeletedRecord, MarketplaceDeletedItem } from '../types';

export const toLocalInput = (date: Date) => format(date, "yyyy-MM-dd'T'HH:mm");

export function clampPage(page: number, count: number, size: number) {
    return Math.max(1, Math.min(Number.isFinite(page) ? Math.trunc(page) : 1, Math.max(1, Math.ceil(count / size))));
}

export function searchResultsForView<T>(all: T[], period: T[], view: 'list' | 'details' | 'trend') {
    return view === 'trend' ? period : all;
}

export function normalizeDeleted(item: MarketplaceDeletedRecord): MarketplaceDeletedItem {
    const timestamp = item.addTime || item.timestamp || '';
    const end = item.removeTime || item.updated || timestamp;
    const startDate = new Date(timestamp);
    const endDate = new Date(end);
    const duration = Number.isFinite(startDate.getTime()) && Number.isFinite(endDate.getTime()) && endDate >= startDate
        ? formatDistanceStrict(startDate, endDate) : '-';
    return { ...item, timestamp, deleted_date: end, last_available: end, duration_online: duration, _isDeleted: true };
}

export function searchFilter(query: { title?: string; user?: string; id?: string }, filter: (expr: string, params: Record<string, unknown>) => string) {
    if (query.id && query.id.length >= 3) return filter('asvz_id ~ {:id}', { id: query.id });
    const conditions = [];
    if (query.title && query.title.length >= 3) conditions.push(filter('title ~ {:title}', { title: query.title }));
    if (query.user && query.user.length >= 3) conditions.push(filter('user ~ {:user}', { user: query.user }));
    return conditions.join(' && ');
}

export type ChartUpdate = Pick<ASVZUpdate, 'timestamp' | 'added' | 'updated' | 'deleted' | 'total_items' | 'total_value'>;

export function dailyUpdates(data: ASVZUpdate[]): ChartUpdate[] {
    const groups: Record<string, ChartUpdate> = {};
    for (const item of data) {
        const day = format(new Date(item.timestamp), 'yyyy-MM-dd');
        const group = groups[day] ??= { timestamp: day, added: 0, updated: 0, deleted: 0, total_items: 0, total_value: 0 };
        group.added += item.added || 0;
        group.updated += item.updated ?? item.update ?? 0;
        group.deleted += item.deleted || 0;
        // Both run types provide complete current DB totals; deltas are summed.
        group.total_items = item.total_items;
        group.total_value = item.total_value;
    }
    return Object.values(groups);
}

export interface CachedImage { url: string | null; error: boolean; expiresAt?: number }
export const IMAGE_MISS_TTL = 60_000;
export const IMAGE_RETRY_DELAY = 5_000;
export function usableImage(entry: CachedImage | undefined, now = Date.now()) {
    return !!entry && (!!entry.url || (typeof entry.expiresAt === 'number' && entry.expiresAt > now));
}

export async function deleteAlerts(ids: string[], remove: (id: string) => Promise<unknown>, onRemoved: (id: string) => void) {
    const failed: string[] = [];
    for (const id of ids) {
        try { await remove(id); onRemoved(id); }
        catch (err) {
            if (err && typeof err === 'object' && 'status' in err && err.status === 404) onRemoved(id);
            else failed.push(id);
        }
    }
    return failed;
}
