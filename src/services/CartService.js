// services/cartService.js
import { supabase } from '../supabase/supabase';

export class CartService {
  // Add to cart
  // Add to CartService class
  static async addToCart(productId, quantity = 1) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: product, error: stockError } = await supabase
        .from('products')
        .select('quantity, name')
        .eq('id', productId)
        .single();

      if (stockError) throw stockError;
      if (!product || product.quantity <= 0) {
        return {
          success: false,
          error: 'out_of_stock',
          message: `${product?.name || 'This product'} is out of stock`,
        };
      }
      if (product.quantity < quantity) {
        return {
          success: false,
          error: 'insufficient_stock',
          message: `Only ${product.quantity} ${product.name} available`,
          availableQuantity: product.quantity,
        };
      }

      const { data, error } = await supabase.rpc('upsert_cart_item', {
        p_customer_id: user.id,
        p_product_id: productId,
        p_quantity: quantity,
      });
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return await this._manualUpsertCart(productId, quantity);
    }
  }

  // NEW: Toggle selection
  static async toggleCartItemSelection(productId, isSelected) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('cart')
        .update({ is_selected: isSelected })
        .eq('customer_id', user.id)
        .eq('product_id', productId)
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error toggling selection:', error);
      return { success: false, error: error.message };
    }
  }

  static async _manualUpsertCart(productId, quantity) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: existing } = await supabase
        .from('cart')
        .select('id, quantity')
        .eq('customer_id', user.id)
        .eq('product_id', productId)
        .single();

      if (existing) {
        const { data, error } = await supabase
          .from('cart')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id)
          .select();
        if (error) throw error;
        return { success: true, data, action: 'updated' };
      } else {
        const { data, error } = await supabase
          .from('cart')
          .insert({
            customer_id: user.id,
            product_id: productId,
            quantity,
            is_selected: true, // NEW: Default to selected
          })
          .select();
        if (error) throw error;
        return { success: true, data, action: 'inserted' };
      }
    } catch (error) {
      console.error('Error managing cart:', error);
      return { success: false, error: error.message };
    }
  }

  // Update getUserCart to include stock info
  // Update getUserCart to fetch is_selected
  static async getUserCart() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('cart')
        .select(
          `
          id,
          quantity,
          is_selected,
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
      console.error('Error fetching cart:', error);
      return { success: false, error: error.message };
    }
  }

  // Remove from cart
  static async removeFromCart(productId) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('customer_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error removing from cart:', error);
      return { success: false, error: error.message };
    }
  }
  // Add this method to your CartService class in cartService.js

  static async updateCartQuantity(productId, action = 'increment') {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Fetch current cart quantity
      const { data: currentData, error: fetchError } = await supabase
        .from('cart')
        .select('quantity')
        .eq('customer_id', user.id)
        .eq('product_id', productId)
        .single();

      if (fetchError) throw fetchError;
      if (!currentData)
        return { success: false, error: 'Item not found in cart' };

      const currentQuantity = currentData.quantity;
      let newQuantity;

      if (action === 'increment') {
        newQuantity = currentQuantity + 1;

        // ✅ ADD STOCK CHECK
        const { data: product, error: stockErr } = await supabase
          .from('products')
          .select('quantity, name')
          .eq('id', productId)
          .single();

        if (stockErr) throw stockErr;
        if (product.quantity < newQuantity) {
          return {
            success: false,
            error: 'insufficient_stock',
            message: `Only ${product.quantity} available`,
          };
        }
      } else if (action === 'decrement') {
        newQuantity = Math.max(1, currentQuantity - 1);
      } else {
        throw new Error('Invalid action');
      }

      if (action === 'decrement' && currentQuantity <= 1) {
        return await this.removeFromCart(productId);
      }

      // Update quantity
      const { data: updateData, error: updateError } = await supabase
        .from('cart')
        .update({ quantity: newQuantity })
        .eq('customer_id', user.id)
        .eq('product_id', productId)
        .select('*');

      if (updateError) throw updateError;

      return {
        success: true,
        data: updateData[0],
        newQuantity,
        action: action === 'increment' ? 'incremented' : 'decremented',
      };
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if in cart
  static async isInCart(productId) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { success: true, isInCart: false, quantity: 0 };

      const { data, error } = await supabase
        .from('cart')
        .select('quantity')
        .eq('customer_id', user.id)
        .eq('product_id', productId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return {
        success: true,
        isInCart: !!data,
        quantity: data?.quantity || 0,
      };
    } catch (error) {
      console.error('Error checking cart:', error);
      return { success: false, error: error.message };
    }
  }

  // Add to CartService
  static async removeByCartRowIds(cartRowIds, userId) {
    try {
      if (!userId) throw new Error('User ID required');
      if (!cartRowIds || cartRowIds.length === 0) {
        return { success: true, deletedCount: 0 };
      }

      const { error } = await supabase
        .from('cart')
        .delete()
        .in('id', cartRowIds)
        .eq('customer_id', userId);

      if (error) throw error;
      return { success: true, deletedCount: cartRowIds.length };
    } catch (error) {
      console.error('Error removing cart rows:', error);
      return { success: false, error: error.message };
    }
  }
}
