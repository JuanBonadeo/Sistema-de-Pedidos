// data.jsx — tenant data for the delivery marketplace
// Using Buenos Aires–style restaurants, ARS pricing

const TENANTS = {
  'nonna-lucia': {
    slug: 'nonna-lucia',
    name: "Nonna Lucía",
    tagline: "Pasta fresca · Palermo",
    category: "Italiana",
    status: 'open', // open | closed | busy
    hours: "Hasta las 23:30",
    delivery: { min: 8500, fee: 1200, eta: "30–45 min" },
    hero: { tone: '#E8DFD0', label: 'fachada · vereda' },
    categories: ['Destacados', 'Entradas', 'Pastas', 'Pizzas', 'Postres', 'Bebidas'],
    products: [
      { id: 'p1', cat: 'Destacados', name: 'Sorrentinos de jamón crudo', desc: 'Masa casera, jamón crudo y muzzarella. Salsa a elección.', price: 9800, tone: '#D9C9A8', modifiers: true },
      { id: 'p2', cat: 'Destacados', name: 'Milanesa napolitana', desc: 'Nalga, jamón, muzzarella y salsa. Papas bastón.', price: 11200, tone: '#C7A87A', modifiers: true },
      { id: 'p3', cat: 'Destacados', name: 'Burrata con tomate cherry', desc: 'Burrata cremosa, cherry confitado, albahaca.', price: 8400, tone: '#E4D8BE', modifiers: false },
      { id: 'p4', cat: 'Pastas', name: 'Ravioles de ricota', desc: 'Ricota y nuez, salsa fileto o crema.', price: 7900, tone: '#D4C29A', modifiers: true },
      { id: 'p5', cat: 'Pastas', name: 'Ñoquis de papa', desc: 'Clásicos del 29. Tuco, pesto o bolognesa.', price: 7200, tone: '#C9B78A', modifiers: true },
      { id: 'p6', cat: 'Pastas', name: 'Tagliatelle al pesto', desc: 'Pasta al huevo, pesto genovés, piñones.', price: 8600, tone: '#B8A878', modifiers: false, soldOut: true },
      { id: 'p7', cat: 'Pizzas', name: 'Muzzarella', desc: 'Masa madre, salsa de tomate, muzzarella, aceitunas.', price: 9500, tone: '#DAB98A', modifiers: true },
      { id: 'p8', cat: 'Pizzas', name: 'Fugazzeta rellena', desc: 'Doble masa, muzzarella y cebolla.', price: 11800, tone: '#C9A878', modifiers: false },
      { id: 'p9', cat: 'Entradas', name: 'Provoleta a la parrilla', desc: 'Con orégano, aceite de oliva y pan.', price: 6800, tone: '#E0CDA0', modifiers: false },
      { id: 'p10', cat: 'Postres', name: 'Tiramisú', desc: 'Mascarpone, café, cacao.', price: 4800, tone: '#B89878', modifiers: false },
      { id: 'p11', cat: 'Postres', name: 'Panna cotta de frutos rojos', desc: 'Crema ligera, coulis de frutos rojos.', price: 4400, tone: '#D8B8A8', modifiers: false },
      { id: 'p12', cat: 'Bebidas', name: 'Limonada de jengibre', desc: 'Medio litro. Jengibre y menta.', price: 3200, tone: '#E8E0C8', modifiers: false },
      { id: 'p13', cat: 'Bebidas', name: 'Malbec Copa', desc: 'Mendoza, cosecha 2022.', price: 4200, tone: '#8A4848', modifiers: false },
    ],
    modifiers: {
      salsa: { title: 'Salsa', required: true, options: [
        { id: 'fileto', label: 'Fileto', delta: 0 },
        { id: 'crema', label: 'Crema', delta: 0 },
        { id: 'bolognesa', label: 'Bolognesa', delta: 800 },
        { id: 'pesto', label: 'Pesto genovés', delta: 600 },
      ]},
      queso: { title: 'Queso rallado', required: false, options: [
        { id: 'si', label: 'Sí, con queso', delta: 0 },
        { id: 'no', label: 'Sin queso', delta: 0 },
      ]},
      extras: { title: 'Extras', required: false, multi: true, options: [
        { id: 'palmito', label: 'Palmitos', delta: 1200 },
        { id: 'huevo', label: 'Huevo frito', delta: 900 },
        { id: 'panceta', label: 'Panceta crocante', delta: 1400 },
      ]},
    },
  },
  'tostado-cafe': {
    slug: 'tostado-cafe',
    name: 'Tostado Café',
    tagline: 'Especialidad · Chacarita',
    category: 'Café',
    status: 'closed',
    hours: 'Abre mañana 8:00',
    delivery: { min: 4500, fee: 900, eta: '20–30 min' },
    hero: { tone: '#D8CFB8', label: 'barra · café' },
    categories: ['Café', 'Tostadas', 'Dulces'],
    products: [],
  },
};

const formatARS = (n) => '$' + n.toLocaleString('es-AR');

Object.assign(window, { TENANTS, formatARS });
