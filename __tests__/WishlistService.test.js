import { WishlistService } from '../src/services/WishlistService';

// Mock supabase client
jest.mock('../src/supabase/supabase', () => {
  const auth = { getUser: jest.fn() };
  const fromMock = jest.fn();
  const tableApi = {
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  };
  fromMock.mockReturnValue(tableApi);
  return {
    supabase: {
      auth,
      from: fromMock,
      __tableApi: tableApi,
    },
  };
});

import { supabase } from '../src/supabase/supabase';

describe('WishlistService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addToWishlist', () => {
    test('returns error when user not authenticated', async () => {
      supabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      const res = await WishlistService.addToWishlist('p1');
      expect(res).toEqual({ success: false, error: 'User not authenticated' });
    });

    test('inserts wishlist row and returns data on success', async () => {
      supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
      supabase.__tableApi.select.mockResolvedValue({ data: [{ id: 1 }], error: null });

      const res = await WishlistService.addToWishlist('p1');

      expect(supabase.from).toHaveBeenCalledWith('wishlist');
      expect(supabase.__tableApi.insert).toHaveBeenCalledWith({ customer_id: 'u1', product_id: 'p1' });
      expect(supabase.__tableApi.select).toHaveBeenCalled();
      expect(res).toEqual({ success: true, data: [{ id: 1 }] });
    });

    test('handles unique violation error (23505) with friendly message', async () => {
      supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
      supabase.__tableApi.select.mockResolvedValue({ data: null, error: { code: '23505' } });

      const res = await WishlistService.addToWishlist('p1');
      expect(res).toEqual({ success: false, error: 'Item already in wishlist' });
    });

    test('propagates other insert errors', async () => {
      supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
      supabase.__tableApi.select.mockResolvedValue({ data: null, error: new Error('boom') });

      const res = await WishlistService.addToWishlist('p1');
      expect(res).toEqual({ success: false, error: 'boom' });
    });
  });

  describe('removeFromWishlist', () => {
    test('returns error when user not authenticated', async () => {
      supabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      const res = await WishlistService.removeFromWishlist('p1');
      expect(res).toEqual({ success: false, error: 'User not authenticated' });
    });

    test('deletes wishlist row by user and product id', async () => {
      supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
      supabase.__tableApi.eq.mockReturnThis();
      supabase.__tableApi.delete.mockReturnThis();
      supabase.__tableApi.eq.mockReturnValueOnce(supabase.__tableApi);
      supabase.__tableApi.eq.mockReturnValueOnce({ error: null });

      const res = await WishlistService.removeFromWishlist('p1');
      expect(supabase.from).toHaveBeenCalledWith('wishlist');
      expect(supabase.__tableApi.delete).toHaveBeenCalled();
      expect(supabase.__tableApi.eq).toHaveBeenNthCalledWith(1, 'customer_id', 'u1');
      expect(supabase.__tableApi.eq).toHaveBeenNthCalledWith(2, 'product_id', 'p1');
      expect(res).toEqual({ success: true });
    });

    test('returns error when delete fails', async () => {
      supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
      supabase.__tableApi.eq.mockReturnThis();
      supabase.__tableApi.delete.mockReturnThis();
      supabase.__tableApi.eq.mockReturnValueOnce(supabase.__tableApi);
      supabase.__tableApi.eq.mockReturnValueOnce({ error: new Error('db down') });

      const res = await WishlistService.removeFromWishlist('p1');
      expect(res).toEqual({ success: false, error: 'db down' });
    });
  });

  describe('getUserWishlist', () => {
    test('returns error when user not authenticated', async () => {
      supabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      const res = await WishlistService.getUserWishlist();
      expect(res).toEqual({ success: false, error: 'User not authenticated' });
    });

    test('selects wishlist with nested product fields and orders by created_at', async () => {
      supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
      supabase.__tableApi.order.mockResolvedValue({ data: [{ id: 1 }], error: null });

      const res = await WishlistService.getUserWishlist();

      expect(supabase.from).toHaveBeenCalledWith('wishlist');
      expect(supabase.__tableApi.select).toHaveBeenCalled();
      expect(supabase.__tableApi.eq).toHaveBeenCalledWith('customer_id', 'u1');
      expect(supabase.__tableApi.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(res).toEqual({ success: true, data: [{ id: 1 }] });
    });

    test('returns error when select fails', async () => {
      supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
      supabase.__tableApi.order.mockResolvedValue({ data: null, error: new Error('fail') });

      const res = await WishlistService.getUserWishlist();
      expect(res).toEqual({ success: false, error: 'fail' });
    });
  });

  describe('isInWishlist', () => {
    test('returns false when user not authenticated', async () => {
      supabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      const res = await WishlistService.isInWishlist('p1');
      expect(res).toEqual({ success: true, isInWishlist: false });
    });

    test('returns true if row exists', async () => {
      supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
      supabase.__tableApi.single.mockResolvedValue({ data: { id: 10 }, error: null });

      const res = await WishlistService.isInWishlist('p1');
      expect(supabase.from).toHaveBeenCalledWith('wishlist');
      expect(supabase.__tableApi.select).toHaveBeenCalledWith('id');
      expect(supabase.__tableApi.eq).toHaveBeenNthCalledWith(1, 'customer_id', 'u1');
      expect(supabase.__tableApi.eq).toHaveBeenNthCalledWith(2, 'product_id', 'p1');
      expect(supabase.__tableApi.single).toHaveBeenCalled();
      expect(res).toEqual({ success: true, isInWishlist: true });
    });

    test('returns false if row not found (PGRST116)', async () => {
      supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
      supabase.__tableApi.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      const res = await WishlistService.isInWishlist('p1');
      expect(res).toEqual({ success: true, isInWishlist: false });
    });

    test('returns error for other failures', async () => {
      supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
      supabase.__tableApi.single.mockResolvedValue({ data: null, error: new Error('bad') });

      const res = await WishlistService.isInWishlist('p1');
      expect(res).toEqual({ success: false, error: 'bad' });
    });
  });
});
