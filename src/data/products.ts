export interface Product {
  id: string;
  name: string;
  image: string;
  code: string;
  url: string;
}

// ==========================================
// 🌟 EDIT YOUR 5 PRODUCTS HERE 🌟
// Yahan apne 5 products ke details change kijiye.
// Har naye user ko inme se koi ek random offer dikhegi!
// ==========================================
export const PRODUCTS: Product[] = [
  {
    id: "product-1",
    name: "Blue Floral Stud Earrings", // <-- 1. Product Name
    image: "https://thevelvetbox.b-cdn.net/product/BM026GPAWS8-1779006596502-992761704.png", // <-- 2. Product Image URL
    code: "WOWDEALS", // <-- 3. Promo Code (50% Off Coupon)
    url: "https://velvetboxs.com/earrings/blue-floral-stude-earrings" // <-- 4. Buy Now Product Link
  },
  {
    id: "product-2",
    name: "Sunshine Orange Enamel Flower Studs", // <-- 1. Product Name
    image: "https://thevelvetbox.b-cdn.net/product/BM026GPONO5-1782128099108-659105644.webp", // <-- 2. Product Image URL
    code: "WOWDEALS", // <-- 3. Promo Code (50% Off Coupon)
    url: "https://velvetboxs.com/earrings/sunshine-orange-enamel-flower-studs" // <-- 4. Buy Now Product Link
  },
  {
    id: "product-3",
    name: "Floral Cluster Statement Ring", // <-- 1. Product Name
    image: "https://thevelvetbox.b-cdn.net/product/BM026HPB28P-1782198711218-866653639.webp", // <-- 2. Product Image URL (Replace with your CDN URL if needed)
    code: "WOWDEALS", // <-- 3. Promo Code (50% Off Coupon)
    url: "https://velvetboxs.com/rings/floral-cluster-statement-ring" // <-- 4. Buy Now Product Link
  },
  {
    id: "product-4",
    name: "Pink Heart Petal Stud Earrings", // <-- 1. Product Name
    image: "https://thevelvetbox.b-cdn.net/product/BM026GPIJ3W-1782129178259-999639095.webp", // <-- 2. Product Image URL
    code: "WOWDEALS", // <-- 3. Promo Code (50% Off Coupon)
    url: "https://velvetboxs.com/earrings/pink-heart-petal-stud-earrings" // <-- 4. Buy Now Product Link
  }
];
