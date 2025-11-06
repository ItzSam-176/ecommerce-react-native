// services/OrderService.js
import { supabase } from '../supabase/supabase';
import { EventBus } from './EventBus';
import { CartService } from './CartService';

export class OrderService {
  // Replace your createOrder with this
  // services/OrderService.js
  static async createOrder(cartItems, options = {}) {
    const {
      coupon = null,
      discount = 0,
      delivery_address_id: deliveryAddressId,
      delivery_charge: deliveryCharge = 0,
      totalAmount,
      selectedItems = [], // array of selected cart item IDs
    } = options;

    console.log('createOrder', cartItems, options);

    // Filter cart items based on selection if provided
    const itemsToOrder =
      selectedItems.length > 0
        ? cartItems.filter(item => selectedItems.includes(item.id))
        : cartItems;

    try {
      if (!Array.isArray(itemsToOrder) || itemsToOrder.length === 0) {
        throw new Error('No items selected for order');
      }

      // 1️⃣ Auth check
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // 2️⃣ Validate stock
      const stockValidation = await this.validateStock(itemsToOrder);
      if (!stockValidation.success) return stockValidation;

      // 3️⃣ Compute subtotal safely
      const subtotal = itemsToOrder.reduce((sum, item) => {
        const price =
          item.products?.price ?? item.unit_price ?? item.price ?? 0;
        return sum + Number(price) * Number(item.quantity);
      }, 0);

      // 4️⃣ Validate coupon
      let serverCoupon = null;
      if (coupon && coupon.id) {
        const { data: couponRow, error: couponErr } = await supabase
          .from('coupons')
          .select('*')
          .eq('id', coupon.id)
          .single();
        if (!couponErr && couponRow && couponRow.is_active) {
          serverCoupon = couponRow;
        }
      }

      let couponAmount = 0;
      if (serverCoupon) {
        const couponCategoryId = String(serverCoupon.category_id);
        const matchingSubtotal = itemsToOrder
          .filter(it =>
            (it.products?.product_categories || []).some(
              pc => String(pc.category_id) === couponCategoryId,
            ),
          )
          .reduce((s, it) => {
            const price = it.products?.price ?? it.unit_price ?? it.price ?? 0;
            return s + Number(price) * Number(it.quantity);
          }, 0);

        if (matchingSubtotal >= Number(serverCoupon.minimum_order_value)) {
          couponAmount = Number(serverCoupon.discount_amount) || 0;
        } else {
          console.warn('[Coupon ignored - minimum not met]', {
            couponId: serverCoupon.id,
            matchingSubtotal,
            min: serverCoupon.minimum_order_value,
          });
          serverCoupon = null;
        }
      }

      // 5️⃣ Delivery and totals
      const amountAfterDiscount = Math.max(0, subtotal - couponAmount);
      console.log(
        '[createOrder] Computing delivery charge for amount:',
        amountAfterDiscount,
      );
      const delivery_charge = await this.computeDeliveryCharge(
        amountAfterDiscount,
      );
      console.log('[createOrder] Computed delivery_charge:', delivery_charge);

      const serverComputedTotal = Number(
        (amountAfterDiscount + delivery_charge).toFixed(2),
      );
      console.log('[createOrder] Server total:', serverComputedTotal);

      if (
        typeof totalAmount !== 'undefined' &&
        totalAmount !== null &&
        Math.abs(Number(totalAmount) - serverComputedTotal) > 0.01
      ) {
        throw new Error(
          `Total mismatch: client ${totalAmount} != server ${serverComputedTotal}`,
        );
      }

      // In createOrder, BEFORE creating order:
      if (deliveryAddressId) {
        const { data: address, error: addrErr } = await supabase
          .from('delivery_addresses')
          .select('id')
          .eq('id', deliveryAddressId)
          .eq('user_id', user.id)
          .single();

        if (addrErr || !address) {
          throw new Error('Invalid or unauthorized delivery address');
        }
      }

      const total_amount = serverComputedTotal;

      // 6️⃣ Create order header
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            customer_id: user.id,
            subtotal,
            coupon_id: serverCoupon?.id || null,
            coupon_amount: couponAmount,
            delivery_charge: delivery_charge,
            total_amount,
            delivery_address_id: deliveryAddressId,
            status: 'pending',
          },
        ])
        .select()
        .single();
      if (orderError) throw orderError;

      const orderId = orderData.id;

      // 🆕 ADD THIS - Record coupon usage if coupon was applied
      if (serverCoupon?.id) {
        const usageResult = await this.recordCouponUsage(
          orderId,
          serverCoupon.id,
          user.id,
        );
        if (!usageResult.success) {
          console.warn(
            '[OrderService] Failed to record coupon usage:',
            usageResult.error,
          );
          // Don't fail the order, just log the warning
        }
      }

      // 7️⃣ Find item for max discount
      let maxItem = null;
      let maxSubtotal = 0;
      for (const item of cartItems) {
        const price =
          item.products?.price ?? item.unit_price ?? item.price ?? 0;
        const sub = Number(price) * Number(item.quantity);
        if (sub > maxSubtotal) {
          maxSubtotal = sub;
          maxItem = item;
        }
      }

      // 8️⃣ Build order items safely
      const orderItems = cartItems.map(item => {
        const unit_price = Number(
          item.products?.price ?? item.unit_price ?? item.price ?? 0,
        );
        const quantity = Number(item.quantity);
        const item_subtotal = unit_price * quantity;

        const productId = item.products?.id ?? item.product_id;
        const isDiscounted =
          maxItem &&
          (item.products?.id ?? item.product_id) ===
            (maxItem.products?.id ?? maxItem.product_id);

        const item_discount = isDiscounted
          ? Math.min(couponAmount, item_subtotal)
          : 0;

        return {
          order_id: orderId,
          product_id: productId,
          unit_price,
          quantity,
          item_subtotal: Number(item_subtotal.toFixed(2)),
          item_discount: Number(item_discount.toFixed(2)),
          item_total: Number((item_subtotal - item_discount).toFixed(2)),
        };
      });

      const { data: insertedItems, error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select();
      if (itemsError) throw itemsError;

      // 9️⃣ Verify total
      const sumItemTotals = insertedItems.reduce(
        (s, it) => s + Number(it.item_total || 0),
        0,
      );
      if (Math.abs(sumItemTotals + delivery_charge - total_amount) > 0.01) {
        throw new Error('Order total mismatch after insert');
      }

      // 🔟 Deduct stock safely
      const stockResult = await this.deductStock(itemsToOrder);
      if (!stockResult.success) throw new Error(stockResult.error);

      // ✅ FIXED - Clear selected cart rows by cart.id
      const cartRowIdsToRemove = itemsToOrder
        .map(item => item.id) // cart row ID
        .filter(Boolean);

      const productIdsForEvent = itemsToOrder
        .map(item => item.products?.id || item.product_id)
        .filter(Boolean);

      if (cartRowIdsToRemove.length > 0) {
        const clearResult = await CartService.removeByCartRowIds(
          cartRowIdsToRemove,
          user.id,
        );

        if (!clearResult.success) {
          throw new Error('Failed to clear cart items after order');
        }

        // Emit event to notify cart updates
        EventBus.emit('cart:changed', {
          type: 'remove',
          productIds: productIdsForEvent, // for UI updates
          cartRowIds: cartRowIdsToRemove, // for precise tracking
          userId: user.id,
          source: 'order',
        });
      }

      return { success: true, orderId };
    } catch (error) {
      console.error('Error creating order:', error);
      return { success: false, error: error.message || String(error) };
    }
  }

  // ✅ Stock validation
  // ✅ Stock validation (robust: supports both cartData and latestCart structures)
  static async validateStock(cartItems) {
    try {
      const productIds = cartItems.map(i =>
        i.products ? i.products.id : i.product_id,
      );

      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, quantity')
        .in('id', productIds);

      if (error) throw error;

      const outOfStock = [];
      const insufficient = [];

      for (const item of cartItems) {
        const productId = item.products ? item.products.id : item.product_id;
        const quantity = item.quantity;
        const product = products.find(p => p.id === productId);

        if (!product) {
          outOfStock.push(
            item.products?.name || item.product_name || productId,
          );
        } else if (product.quantity < quantity) {
          insufficient.push({
            name: product.name,
            available: product.quantity,
            requested: quantity,
          });
        }
      }

      if (outOfStock.length > 0)
        return {
          success: false,
          error: 'out_of_stock',
          message: `Out of stock: ${outOfStock.join(', ')}`,
        };

      if (insufficient.length > 0)
        return {
          success: false,
          error: 'insufficient_stock',
          message: `Insufficient stock for: ${insufficient
            .map(i => `${i.name}`)
            .join(', ')}`,
        };

      return { success: true };
    } catch (err) {
      console.error('Error validating stock:', err);
      return { success: false, error: err.message };
    }
  }

  // ✅ Deduct stock
  static async deductStock(cartItems) {
    try {
      for (const item of cartItems) {
        const productId = item.products?.id ?? item.product_id;
        if (!productId) {
          console.warn('[deductStock] Missing product_id', item);
          continue;
        }
        const { error } = await supabase.rpc('decrement_stock', {
          product_id: productId,
          quantity_to_deduct: item.quantity,
        });
        if (error) throw error;
      }
      return { success: true };
    } catch (err) {
      console.error('Error deducting stock:', err);
      return { success: false, error: err.message };
    }
  }

  // ✅ Clear cart
  // 🧱 Clear only selected cart rows
  static async clearCart(userId, productIds = []) {
    try {
      if (!userId) throw new Error('User ID is required');

      let query = supabase.from('cart').delete();

      // Always filter by customer_id
      query = query.eq('customer_id', userId);

      // If specific product IDs are provided, only delete those
      if (Array.isArray(productIds) && productIds.length > 0) {
        query = query.in('product_id', productIds);
      }

      const { error } = await query;
      if (error) throw error;

      return { success: true, clearedIds: productIds };
    } catch (err) {
      console.error('Error clearing cart:', err);
      return { success: false, error: err.message };
    }
  }

  // ✅ Delivery charge rule - consistent with client logic
  static async computeDeliveryCharge(amount) {
    try {
      console.log('[computeDeliveryCharge] Fetching rules for amount:', amount);

      const { data: rules, error } = await supabase
        .from('delivery_charge_rules')
        .select('*')
        .order('min_cart_value', { ascending: true });

      console.log('[computeDeliveryCharge] Rules fetched:', {
        rulesCount: rules?.length,
        error: error?.message,
      });

      if (error || !rules?.length) {
        console.warn('[computeDeliveryCharge] No rules found or error');
        return 0;
      }

      let charge = 0;
      for (const rule of rules) {
        const min = Number(rule.min_cart_value || 0);
        const max = Number(rule.max_cart_value || Infinity);
        console.log('[computeDeliveryCharge] Checking rule:', {
          min,
          max,
          charge: rule.charge_amount,
          matches: amount >= min && amount <= max,
        });

        if (amount >= min && amount <= max) {
          charge = Number(rule.charge_amount || 0);
          console.log('[computeDeliveryCharge] Rule matched! Charge:', charge);
          break;
        }
      }

      console.log('[computeDeliveryCharge] Final charge:', charge);
      return charge;
    } catch (err) {
      console.error('[computeDeliveryCharge] failed:', err);
      return 0;
    }
  }

  // ✅ Fetch orders with items
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
          status,
          subtotal,
          coupon_amount,
          delivery_charge,
          total_amount,
          created_at,
          order_items (
            id,
            quantity,
            unit_price,
            item_discount,
            item_total,
            products (
              id,
              name,
              description,
              product_images (image_url)
            )
          )
        `,
        )
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('Error fetching orders:', err);
      return { success: false, error: err.message };
    }
  }

  // Add this to OrderService class
  static async recordCouponUsage(orderId, couponId, userId) {
    try {
      if (!orderId || !couponId || !userId) {
        throw new Error('Missing required parameters for coupon usage');
      }

      const { data, error } = await supabase
        .from('coupon_usage')
        .insert([
          {
            order_id: orderId,
            coupon_id: couponId,
            customer_id: userId,
            used_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      console.log('[OrderService] Coupon usage recorded', {
        orderId,
        couponId,
        usageId: data.id,
      });

      return { success: true, data };
    } catch (error) {
      console.error('[OrderService] Failed to record coupon usage:', error);
      return { success: false, error: error.message };
    }
  }
}
