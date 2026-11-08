import test from 'node:test';
import assert from 'node:assert/strict';
import PocketBase from 'pocketbase';
import {
    clampPage, searchResultsForView, normalizeDeleted, searchFilter, toLocalInput,
    dailyUpdates, usableImage, IMAGE_MISS_TTL, deleteAlerts,
} from '../src/lib/data.ts';

process.env.TZ = 'Europe/Berlin';

test('list and grid retain matches from October when November is selected for trends', () => {
    const all = [{ id: 'oct', timestamp: '2026-10-15' }, { id: 'nov', timestamp: '2026-11-01' }];
    const november = [all[1]];
    assert.deepEqual(searchResultsForView(all, november, 'list'), all);
    assert.deepEqual(searchResultsForView(all, november, 'details'), all);
    assert.deepEqual(searchResultsForView(all, november, 'trend'), november);
});

test('persisted grid pages clamp after result shrinkage and malformed storage', () => {
    for (const requested of [2, 90, NaN, -5, Infinity]) assert.equal(clampPage(requested, 5, 24), 1);
    assert.equal(clampPage(9, 25, 24), 2);
    assert.equal(clampPage(2, 0, 24), 1);
});

test('deleted API addTime supplies creation date and duration', () => {
    const item = normalizeDeleted({ id: 'deleted', addTime: '2026-11-01T12:00:00Z', removeTime: '2026-11-03T12:00:00Z' });
    assert.equal(item.timestamp, '2026-11-01T12:00:00Z');
    assert.equal(item.last_available, '2026-11-03T12:00:00Z');
    assert.equal(item.duration_online, '2 days');
    assert.equal(item._isDeleted, true);
    assert.equal(normalizeDeleted({ addTime: 'invalid', removeTime: 'invalid' }).duration_online, '-');
});

test('quoted titles and crafted sellers remain escaped PocketBase literals', () => {
    const pb = new PocketBase();
    const filter = searchFilter({ title: 'VFC "HK416"', user: 'x" || price >= 0 || user ~ "' }, pb.filter.bind(pb));
    assert.equal(filter, pb.filter('title ~ {:title} && user ~ {:user}', { title: 'VFC "HK416"', user: 'x" || price >= 0 || user ~ "' }));
    assert.equal(searchFilter({ id: '123"', title: 'ignored' }, pb.filter.bind(pb)), pb.filter('asvz_id ~ {:id}', { id: '123"' }));
});

for (const [instant, local] of [['2026-11-08T12:00:00Z', '2026-11-08T13:00'], ['2026-07-08T12:00:00Z', '2026-07-08T14:00']]) {
    test(`datetime-local round-trips ${instant} without an offset shift`, () => {
        assert.equal(toLocalInput(new Date(instant)), local);
        assert.equal(new Date(toLocalInput(new Date(instant))).toISOString(), instant.replace('Z', '.000Z'));
    });
}

test('daily totals use the local calendar and sum full and short activity once', () => {
    const data = [
        { timestamp: '2026-11-07T23:15:00Z', added: 2, updated: 1, deleted: 0, total_items: 12, total_value: 120 },
        { timestamp: '2026-11-08T01:00:00Z', added: 0, updated: 2, deleted: 1, total_items: 11, total_value: 110 },
    ];
    assert.deepEqual(dailyUpdates(data), [{ timestamp: '2026-11-08', added: 2, updated: 3, deleted: 1, total_items: 11, total_value: 110 }]);
});

test('negative image entries expire; old permanent misses are retried', () => {
    const now = 1000;
    assert.equal(usableImage({ url: null, error: true }, now), false);
    assert.equal(usableImage({ url: null, error: true, expiresAt: now + IMAGE_MISS_TTL }, now), true);
    assert.equal(usableImage({ url: null, error: true, expiresAt: now }, now), false);
    assert.equal(usableImage({ url: 'https://example.invalid/image.jpg', error: false }, now), true);
});

test('partial alert deletion reconciles successes and 404s, then retries only failures', async () => {
    const selected = new Set(['a', 'b', 'c', 'd']);
    const rows = new Set(selected);
    const calls = [];
    const failed = await deleteAlerts([...selected], async id => {
        calls.push(id);
        if (id === 'b') throw { status: 500 };
        if (id === 'c') throw { status: 404 };
    }, id => { rows.delete(id); selected.delete(id); });
    assert.deepEqual(calls, ['a', 'b', 'c', 'd']);
    assert.deepEqual([...selected], ['b']);
    assert.deepEqual([...rows], ['b']);
    assert.deepEqual(failed, ['b']);
    assert.deepEqual(await deleteAlerts([...selected], async () => {}, id => selected.delete(id)), []);
    assert.equal(selected.size, 0);
});
