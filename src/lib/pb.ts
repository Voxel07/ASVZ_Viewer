import PocketBase, { ClientResponseError } from 'pocketbase';

export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'https://pb.matzeschneider.de');

// Independent views query the same collection endpoints. Each view owns its
// request lifetime through AbortController instead of cancelling other views.
pb.autoCancellation(false);

export function isRequestAbort(error: unknown): boolean {
    return error instanceof ClientResponseError && error.isAbort;
}
