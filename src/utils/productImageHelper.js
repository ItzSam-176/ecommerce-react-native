// src/utils/productImageHelper.js

/**
 * Get the primary image URL for a product
 * Returns the first image from product_images table (by display_order)
 */
export const getProductPrimaryImage = product => {
  if (!product) return null;

  // Check if product has product_images array
  if (
    product.product_images &&
    Array.isArray(product.product_images) &&
    product.product_images.length > 0
  ) {
    // Sort by display_order and get first image
    const sortedImages = [...product.product_images].sort((a, b) => {
      const orderA = a.display_order ?? 999;
      const orderB = b.display_order ?? 999;
      return orderA - orderB;
    });
    return sortedImages[0]?.image_url || null;
  }

  // No images available
  return null;
};

/**
 * Get all images for a product (sorted by display_order)
 */
export const getProductImages = product => {
  if (!product) return [];

  if (
    product.product_images &&
    Array.isArray(product.product_images) &&
    product.product_images.length > 0
  ) {
    return product.product_images
      .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999))
      .map(img => img.image_url)
      .filter(url => url); // Remove any null/undefined URLs
  }

  return [];
};

/**
 * Check if product has images
 */
export const hasProductImages = product => {
  return (
    product?.product_images &&
    Array.isArray(product.product_images) &&
    product.product_images.length > 0
  );
};
