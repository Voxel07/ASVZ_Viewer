import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultEgunFilters, filterEgun, egunImage, egunLink } from '../src/lib/egun.ts';

const item = (id, overrides = {}) => ({
    id: String(id), egun_id: id, title: 'VFC HK416', user: 'Seller', price: 100,
    buy_now_price: 150, bids: 3, listing_type: 'auction', condition: 'Neuware',
    seller_type: 'privat', active: true, first_seen: '2026-11-15T12:00:00Z',
    ends_at: '2026-11-20T12:00:00Z', price_change: 0, buy_now_change: 0,
    last_price_change: '', ...overrides,
});

test('eGun search combines title, seller, exact ID, price, type, condition, and status', () => {
    const rows = [item(123), item(1234), item(124, { active: false })];
    assert.deepEqual(filterEgun(rows, { ...defaultEgunFilters, title: 'hk416', seller: 'SELL', id: '123', min: '0', max: '100', type: 'buy-now', condition: 'Neuware', sellerType: 'privat' }).map(row => row.egun_id), [123]);
    assert.deepEqual(filterEgun(rows, { ...defaultEgunFilters, status: 'inactive' }).map(row => row.egun_id), [124]);
    assert.equal(filterEgun(rows, { ...defaultEgunFilters, type: 'fixed' }).length, 0);
    assert.equal(filterEgun(rows, { ...defaultEgunFilters, min: '101' }).length, 0);
});

test('auction bid increases and buy-now reductions remain independent', () => {
    const rows = [item(1, { price_change: 10, buy_now_change: -20, last_price_change: '2026-11-14T12:00:00Z' }), item(2, { price_change: -10, last_price_change: '2026-11-15T12:00:00Z' }), item(3)];
    for (const [change, ids] of [['up', [1]], ['down', [2]], ['buy-down', [1]], ['buy-up', []], ['changed', [1, 2]]]) {
        assert.deepEqual(filterEgun(rows, { ...defaultEgunFilters, change }).map(row => row.egun_id), ids);
    }
    assert.deepEqual(filterEgun(rows, { ...defaultEgunFilters, changedSince: '2026-11-15T00:00:00Z' }).map(row => row.egun_id), [2]);
});

test('price sorting does not mutate cached eGun records', () => {
    const rows = [item(1, { price: 200 }), item(2)];
    assert.deepEqual(filterEgun(rows, { ...defaultEgunFilters, sort: 'price-asc' }).map(row => row.egun_id), [2, 1]);
    assert.deepEqual(rows.map(row => row.egun_id), [1, 2]);
});

test('listing links use eGun and images reject unrelated hosts or unsafe schemes', () => {
    assert.equal(egunLink(123), 'https://www.egun.de/item/123');
    assert.equal(egunImage('https://www.egun.de/thumb/photo.jpg'), 'https://www.egun.de/thumb/photo.jpg');
    for (const url of ['javascript:alert(1)', 'https://example.com/a.jpg', '', 'http://www.egun.de/a.jpg']) assert.equal(egunImage(url), undefined);
});
