import { useState, useEffect } from 'react';
import { pb } from '../lib/pb';
import type { MarketplaceItem, MarketplaceDeletedItem } from '../types';

interface ImageStore {
    [asvz_id: string]: {
        url: string | null;
        error: boolean;
    };
}

// Global cache so revisiting pages is instant. We initialize it from localStorage.
const globalImageCache: ImageStore = (() => {
    try {
        const cached = localStorage.getItem('asvzImagesCache');
        if (cached) return JSON.parse(cached);
    } catch (e) {
        console.warn('Failed to parse cached images from localStorage', e);
    }
    return {};
})();

function persistCacheToStorage() {
    try {
        localStorage.setItem('asvzImagesCache', JSON.stringify(globalImageCache));
    } catch (e) {
        // e.g., QuotaExceededError if cache gets too large. It's safe to ignore,
        // we'll just fall back to memory caching if full.
        console.warn('Failed to save image cache to localStorage', e);
    }
}

export function useProductImages(items: (MarketplaceItem | MarketplaceDeletedItem)[]) {
    const [imageUrls, setImageUrls] = useState<ImageStore>(globalImageCache);
    const [loading, setLoading] = useState<boolean>(true);

    const stringifiedIds = items.map(i => i.asvz_id).join(',');

    useEffect(() => {
        // Find which items actually need fetching (not in cache)
        const currentIds = stringifiedIds ? stringifiedIds.split(',') : [];
        const missingIds = currentIds.filter(id => !globalImageCache[id]);

        if (missingIds.length === 0) {
            setLoading(false);
            // Only update if our own state is missing values to avoid unnecessary re-renders
            setImageUrls(prev => {
                const needsUpdate = currentIds.some(id => !prev[id]);
                if (needsUpdate) return { ...globalImageCache };
                return prev;
            });
            return;
        }

        let isMounted = true;
        setLoading(true);

        async function fetchMissingImages() {
            try {
                // Batch fetch: e.g., asvz_id="1" || asvz_id="2"
                // PocketBase allows up to 500 items per page by default, so length ~24 is fine
                const filterStr = missingIds.map(id => `asvz_id="${id}"`).join(' || ');

                const records = await pb.collection('asvz_images').getFullList({
                    filter: filterStr,
                });

                const newCacheUpdates: ImageStore = {};

                // Map found records
                for (const record of records) {
                    const id = record.asvz_id;
                    const url = pb.files.getURL(record, record.img || `${id}.jpg`);
                    newCacheUpdates[id] = { url, error: false };
                }

                // Any requested id that wasn't found in records resulted in a miss/error
                for (const id of missingIds) {
                    if (!newCacheUpdates[id]) {
                        newCacheUpdates[id] = { url: null, error: true };
                    }
                }

                // Update global cache
                Object.assign(globalImageCache, newCacheUpdates);
                persistCacheToStorage();

                if (isMounted) {
                    setImageUrls({ ...globalImageCache });
                }
            } catch (err) {
                // On overall error (like network issue), mark all missings as error
                const errorUpdates: ImageStore = {};
                for (const id of missingIds) {
                    errorUpdates[id] = { url: null, error: true };
                }
                Object.assign(globalImageCache, errorUpdates);

                if (isMounted) {
                    setImageUrls({ ...globalImageCache });
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchMissingImages();

        return () => {
            isMounted = false;
        };
    }, [stringifiedIds]); // Depend on ID string to prevent loop on new array references

    return { imageUrls, loadingImages: loading };
}
