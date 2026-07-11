import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        restaurants: resolve(__dirname, 'pages/restaurants.html'),
        restaurant: resolve(__dirname, 'pages/restaurant.html'),
        food: resolve(__dirname, 'pages/food.html'),
        cart: resolve(__dirname, 'pages/cart.html'),
        checkout: resolve(__dirname, 'pages/checkout.html'),
        offers: resolve(__dirname, 'pages/offers.html'),
        community: resolve(__dirname, 'pages/community.html'),
        orderSuccess: resolve(__dirname, 'pages/order-success.html'),
        orderTracking: resolve(__dirname, 'pages/order-tracking.html'),
      },
    },
  },
});
