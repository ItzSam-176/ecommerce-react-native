// services/OrderService.js
import { supabase } from '../supabase/supabase';

export class OrderService {
  // Create order from cart items
  static async createOrder(cartItems, options = {}) {
    const { coupon, discount = 0, deliveryAddressId } = options;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const stockValidation = await this.validateStock(cartItems);
      if (!stockValidation.success) {
        return stockValidation;
      }

      const orderItems = cartItems.map(item => {
        const itemSubtotal = item.products.price * item.quantity;
        const itemFinalPrice = Math.max(0, itemSubtotal - discount);

        return {
          customer_id: user.id,
          product_id: item.products.id,
          quantity: item.quantity,
          price: item.products.price,
          status: 'Pending',
          total_price: itemFinalPrice.toFixed(2),
          coupon_id: coupon?.id || null,
          coupon_discount: discount,
          delivery_address_id: deliveryAddressId, // ✅ ADD THIS
          delivery_charge: 0, // Default to 0, can be updated later
        };
      });

      const { data, error } = await supabase
        .from('orders')
        .insert(orderItems)
        .select();

      if (error) throw error;

      await this.deductStock(cartItems);
      await this.clearCart(user.id);

      return {
        success: true,
        data,
        orderId: data[0]?.id,
      };
    } catch (error) {
      console.error('Error creating order:', error);
      return { success: false, error: error.message };
    }
  }

  // Validate stock availability
  static async validateStock(cartItems) {
    try {
      const productIds = cartItems.map(item => item.products.id);

      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, quantity')
        .in('id', productIds);

      if (error) throw error;

      const outOfStock = [];
      const insufficient = [];

      cartItems.forEach(cartItem => {
        const product = products.find(p => p.id === cartItem.products.id);
        if (!product) {
          outOfStock.push(cartItem.products.name);
        } else if (product.quantity < cartItem.quantity) {
          insufficient.push({
            name: product.name,
            available: product.quantity,
            requested: cartItem.quantity,
          });
        }
      });

      if (outOfStock.length > 0) {
        return {
          success: false,
          error: 'out_of_stock',
          items: outOfStock,
          message: `Out of stock: ${outOfStock.join(', ')}`,
        };
      }

      if (insufficient.length > 0) {
        return {
          success: false,
          error: 'insufficient_stock',
          items: insufficient,
          message: `Insufficient stock for: ${insufficient
            .map(
              i =>
                `${i.name} (${i.available} available, ${i.requested} requested)`,
            )
            .join(', ')}`,
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error validating stock:', error);
      return { success: false, error: error.message };
    }
  }

  // Deduct stock after order
  static async deductStock(cartItems) {
    try {
      const updates = cartItems.map(async item => {
        const { error } = await supabase.rpc('decrement_stock', {
          product_id: item.products.id,
          quantity_to_deduct: item.quantity,
        });
        if (error) throw error;
      });

      await Promise.all(updates);
      return { success: true };
    } catch (error) {
      // Fallback to manual update
      return await this._manualDeductStock(cartItems);
    }
  }

  // Manual stock deduction (fallback)
  static async _manualDeductStock(cartItems) {
    try {
      const updates = cartItems.map(async item => {
        const { data: product } = await supabase
          .from('products')
          .select('quantity')
          .eq('id', item.products.id)
          .single();

        if (product) {
          const newQuantity = Math.max(0, product.quantity - item.quantity);
          await supabase
            .from('products')
            .update({ quantity: newQuantity })
            .eq('id', item.products.id);
        }
      });

      await Promise.all(updates);
      return { success: true };
    } catch (error) {
      console.error('Error deducting stock:', error);
      return { success: false, error: error.message };
    }
  }

  // Clear cart after checkout
  static async clearCart(userId) {
    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('customer_id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error clearing cart:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user orders
  static async getUserOrders() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          id,
          quantity,
          price,
          status,
          created_at,
          products (
            id,
            name,
            description,
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
      console.error('Error fetching orders:', error);
      return { success: false, error: error.message };
    }
  }
}
