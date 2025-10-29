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

      // ✅ CHECK STOCK BEFORE ADDING
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

      // Try to insert, if exists, update quantity
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

  // Manual upsert (fallback)
  static async _manualUpsertCart(productId, quantity) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if item exists
      const { data: existing } = await supabase
        .from('cart')
        .select('id, quantity')
        .eq('customer_id', user.id)
        .eq('product_id', productId)
        .single();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('cart')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id)
          .select();

        if (error) throw error;
        return { success: true, data, action: 'updated' };
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('cart')
          .insert({
            customer_id: user.id,
            product_id: productId,
            quantity,
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
        created_at,
        products (
          id,
          name,
          price,
          description,
          image_url,
          quantity
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
      console.log(
        `(CartService) Removing product ${productId} for user ${user.id}`,
      );
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error removing from cart:', error);
      return { success: false, error: error.message };
    }
  }
  // Add this method to your CartService class in cartService.js

  static async updateCartQuantity(productId, action = 'increment') {
    console.log(`(CartService) ${action}ing quantity for product ${productId}`);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log('(CartService) User authenticated:', user?.id);

      if (!user) throw new Error('User not authenticated');

      // First, get the current quantity
      console.log('(CartService) Fetching current quantity...');
      const { data: currentData, error: fetchError } = await supabase
        .from('cart')
        .select('quantity')
        .eq('customer_id', user.id)
        .eq('product_id', productId)
        .single();

      if (fetchError) {
        console.error(
          '(CartService) Error fetching current quantity:',
          fetchError,
        );
        throw fetchError;
      }

      if (!currentData) {
        console.log('(CartService) Item not found in cart');
        return { success: false, error: 'Item not found in cart' };
      }

      const currentQuantity = currentData.quantity;
      let newQuantity;

      // Calculate new quantity based on action
      if (action === 'increment') {
        newQuantity = currentQuantity + 1;
        console.log(
          `(CartService) Incrementing: ${currentQuantity} → ${newQuantity}`,
        );
      } else if (action === 'decrement') {
        newQuantity = Math.max(1, currentQuantity - 1); // Don't go below 1
        console.log(
          `(CartService) Decrementing: ${currentQuantity} → ${newQuantity}`,
        );
      } else {
        throw new Error('Invalid action. Use "increment" or "decrement"');
      }

      // If decrementing would result in 0, remove the item instead
      if (action === 'decrement' && currentQuantity <= 1) {
        console.log('(CartService) Quantity would be 0, removing item instead');
        return await this.removeFromCart(productId);
      }

      // Update the quantity
      console.log(`(CartService) Updating quantity to ${newQuantity}`);
      const { data: updateData, error: updateError } = await supabase
        .from('cart')
        .update({ quantity: newQuantity })
        .eq('customer_id', user.id)
        .eq('product_id', productId)
        .select('*');

      if (updateError) {
        console.error('(CartService) Error updating quantity:', updateError);
        throw updateError;
      }

      console.log('(CartService) Successfully updated quantity:', updateData);
      return {
        success: true,
        data: updateData[0],
        newQuantity,
        action: action === 'increment' ? 'incremented' : 'decremented',
      };
    } catch (error) {
      console.error('(CartService) Error updating cart quantity:', error);
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
}
