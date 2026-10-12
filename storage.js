// Browser-only demo persistence. Do not use this as production authentication or payment storage.
const Store = {
  read(key, fallback = []) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch { return fallback; }
  },
  write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  },
  users() { return this.read("hydroseal_users", []); },
  saveUsers(v) { return this.write("hydroseal_users", v); },
  cart() { return this.read("hydroseal_cart", []); },
  saveCart(v) { return this.write("hydroseal_cart", v); },
  wishlist() { return this.read("hydroseal_wishlist", []); },
  saveWishlist(v) { return this.write("hydroseal_wishlist", v); },
  orders() { return this.read("hydroseal_orders", []); },
  saveOrders(v) { return this.write("hydroseal_orders", v); },
  reviews() { return this.read("hydroseal_reviews", []); },
  saveReviews(v) { return this.write("hydroseal_reviews", v); },
  currentUser() {
    try {
      const session = JSON.parse(sessionStorage.getItem("hydroseal_session") || "null");
      return session ? this.users().find(u => u.id === session.userId) || null : null;
    } catch { return null; }
  },
  login(userId) { sessionStorage.setItem("hydroseal_session", JSON.stringify({ userId })); },
  logout() { sessionStorage.removeItem("hydroseal_session"); },
  clearDemoData() {
    ["hydroseal_users","hydroseal_cart","hydroseal_wishlist","hydroseal_orders","hydroseal_reviews","hydroseal_last_order"].forEach(k => localStorage.removeItem(k));
    this.logout();
  }
};