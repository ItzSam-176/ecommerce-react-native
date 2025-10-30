// services/wishlistService.js
import { supabase } from '../supabase/supabase';

export class WishlistService {
  // Add to wishlist
  static async addToWishlist(productId) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('wishlist')
        .insert({
          customer_id: user.id,
          product_id: productId,
        })
        .select();

      if (error) {
        if (error.code === '23505') {
          // Unique violation
          throw new Error('Item already in wishlist');
        }
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return { success: false, error: error.message };
    }
  }

  // Remove from wishlist
  static async removeFromWishlist(productId) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('customer_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user's wishlist
  static async getUserWishlist() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('wishlist')
        .select(
          `
          id,
          created_at,
          products (
            id,
            name,
            price,
            description,
            quantity,
            product_categories (
              category_id,
              category:category_id (
                id,
                name
              )
            ),
            product_images (
              id,
              image_url,
              display_order
            )
          )
        `,
        )
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if in wishlist
  static async isInWishlist(productId) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { success: true, isInWishlist: false };

      const { data, error } = await supabase
        .from('wishlist')
        .select('id')
        .eq('customer_id', user.id)
        .eq('product_id', productId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return { success: true, isInWishlist: !!data };
    } catch (error) {
      console.error('Error checking wishlist:', error);
      return { success: false, error: error.message };
    }
  }
}
