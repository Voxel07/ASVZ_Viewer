import { useState, useEffect } from 'react';
import { pb, isRequestAbort } from '../lib/pb';
import type { MarketplaceItem, MarketplaceDeletedItem } from '../types';
import { usableImage, IMAGE_MISS_TTL, IMAGE_RETRY_DELAY, type CachedImage } from '../lib/data';

type ImageStore = Record<string, CachedImage>;
const globalImageCache: ImageStore = (() => {
    try {
        const stored: ImageStore = JSON.parse(localStorage.getItem('asvzImagesCache') || '{}');
        return Object.fromEntries(Object.entries(stored).filter(([, entry]) => entry && typeof entry.url === 'string' && entry.url));
    } catch { return {}; }
})();

function persistCache() {
    try {
        localStorage.setItem('asvzImagesCache', JSON.stringify(Object.fromEntries(
            Object.entries(globalImageCache).filter(([, entry]) => entry.url)
        )));
    } catch (err) { console.warn('Failed to save image cache', err); }
}

export function useProductImages(items: (MarketplaceItem | MarketplaceDeletedItem)[]) {
    const [imageUrls, setImageUrls] = useState<ImageStore>({ ...globalImageCache });
    const [loading, setLoading] = useState(true);
    const [retry, setRetry] = useState(0);
    const idsKey = items.map(item => item.asvz_id).join(',');

    useEffect(() => {
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout> | undefined;
        const ids = [...new Set(idsKey ? idsKey.split(',') : [])];
        const missingIds = ids.filter(id => !usableImage(globalImageCache[id]));
        for (const id of missingIds) delete globalImageCache[id];
        async function fetchImages() {
            // Scheduling state updates with the request also avoids effect cascades.
            await Promise.resolve();
            if (controller.signal.aborted) return;
            setLoading(missingIds.length > 0);
            let transient: ImageStore = {};
            let retryDelay = Infinity;
            try {
                if (missingIds.length) {
                    const records = await pb.collection('asvz_images').getFullList({
                        filter: missingIds.map(id => pb.filter('asvz_id = {:id}', { id })).join(' || '),
                        signal: controller.signal,
                    });
                    if (controller.signal.aborted) return;
                    const found: ImageStore = {};
                    for (const record of records) {
                        if (record.img) found[String(record.asvz_id)] = { url: pb.files.getURL(record, record.img), error: false };
                    }
                    for (const id of missingIds) {
                        globalImageCache[id] = found[id] || { url: null, error: true, expiresAt: Date.now() + IMAGE_MISS_TTL };
                    }
                    persistCache();
                }
            } catch (err) {
                if (controller.signal.aborted || isRequestAbort(err)) return;
                transient = Object.fromEntries(missingIds.map(id => [id, { url: null, error: true }]));
                retryDelay = IMAGE_RETRY_DELAY;
            }
            if (controller.signal.aborted) return;
            setImageUrls({ ...globalImageCache, ...transient });
            setLoading(false);
            for (const id of ids) {
                const entry = globalImageCache[id];
                if (entry?.expiresAt) retryDelay = Math.min(retryDelay, Math.max(1, entry.expiresAt - Date.now()));
            }
            if (Number.isFinite(retryDelay)) timer = setTimeout(() => setRetry(value => value + 1), retryDelay);
        }
        void fetchImages();
        return () => { controller.abort(); clearTimeout(timer); };
    }, [idsKey, retry]);
    return { imageUrls, loadingImages: loading };
}
