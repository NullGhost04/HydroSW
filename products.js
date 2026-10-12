// Demo product data. Replace package sizes, prices, and stock with verified project information.
const HYDROSEAL = {
  name: "HydroSeal Gel",
  code: "HS-01",
  description: "Concrete crack sealing gel",
  variants: [
    { id: "HS-500ML", size: "500ML", price: 300, stock: 50, note: "Small jobs", image: "images/500ML.jpg" },
    { id: "HS-750ML", size: "750ML", price: 450, stock: 40, note: "Everyday repairs", image: "images/750ML.jpg" },
    { id: "HS-1L", size: "1L", price: 550, stock: 30, note: "Home projects", image: "images/1L.jpg" },
    { id: "HS-2L", size: "2L", price: 850, stock: 20, note: "Larger projects", image: "images/2L.jpg" },
    { id: "HS-5L", size: "5L", price: 1800, stock: 10, note: "Bulk repair jobs", image: "images/5L.jpg" }
  ],
  deliveryFee: 50
};
function money(amount) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(amount) || 0);
}
function getVariant(id) {
  return HYDROSEAL.variants.find(v => v.id === id);
}