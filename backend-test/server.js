const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Configurar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ DATOS DE PRUEBA ============
const products = [
    {
        id: 1,
        name: "Café Americano",
        price: 35,
        category: "cafe",
        description: "Café negro de origen colombiano",
        isAvailable: true
    },
    {
        id: 2,
        name: "Latte",
        price: 45,
        category: "cafe",
        description: "Café con leche espumada",
        isAvailable: true
    },
    {
        id: 3,
        name: "Capuccino",
        price: 50,
        category: "cafe",
        description: "Café con leche y espuma de leche",
        isAvailable: true
    },
    {
        id: 4,
        name: "Té Verde",
        price: 30,
        category: "te",
        description: "Té verde japonés con matcha",
        isAvailable: true
    },
    {
        id: 5,
        name: "Cheesecake",
        price: 60,
        category: "postre",
        description: "Cheesecake con frutos rojos",
        isAvailable: true
    }
];

let orders = [];
let orderId = 1;

// ============ RUTAS ============

// Ruta de bienvenida
app.get('/', (req, res) => {
    res.json({
        message: '☕ Aurora\'s N Coffee API',
        version: '1.0.0',
        status: 'online',
        endpoints: {
            products: '/api/products',
            orders: '/api/orders',
            test: '/api/test'
        }
    });
});

// ===== PRODUCTOS =====

// Obtener todos los productos
app.get('/api/products', (req, res) => {
    const { category, search } = req.query;
    let result = products;

    // Filtrar por categoría
    if (category) {
        result = result.filter(p => p.category === category);
    }

    // Buscar por nombre
    if (search) {
        result = result.filter(p => 
            p.name.toLowerCase().includes(search.toLowerCase())
        );
    }

    res.json({
        success: true,
        count: result.length,
        data: result
    });
});

// Obtener producto por ID
app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Producto no encontrado'
        });
    }

    res.json({
        success: true,
        data: product
    });
});

// Crear producto (POST)
app.post('/api/products', (req, res) => {
    const { name, price, category, description } = req.body;

    if (!name || !price || !category) {
        return res.status(400).json({
            success: false,
            message: 'Faltan campos obligatorios: name, price, category'
        });
    }

    const newProduct = {
        id: products.length + 1,
        name,
        price: Number(price),
        category,
        description: description || '',
        isAvailable: true
    };

    products.push(newProduct);

    res.status(201).json({
        success: true,
        data: newProduct,
        message: 'Producto creado exitosamente'
    });
});

// ===== PEDIDOS =====

// Crear pedido
app.post('/api/orders', (req, res) => {
    const { items, customer, deliveryType } = req.body;

    if (!items || !items.length) {
        return res.status(400).json({
            success: false,
            message: 'El pedido debe tener al menos un producto'
        });
    }

    let total = 0;
    const orderItems = items.map(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) {
            throw new Error(`Producto ${item.productId} no encontrado`);
        }
        const subtotal = product.price * item.quantity;
        total += subtotal;
        return {
            product: product.name,
            productId: product.id,
            quantity: item.quantity,
            price: product.price,
            subtotal
        };
    });

    const order = {
        id: orderId++,
        items: orderItems,
        total: total,
        customer: customer || 'Cliente anónimo',
        deliveryType: deliveryType || 'local',
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    orders.push(order);

    res.status(201).json({
        success: true,
        data: order,
        message: '¡Pedido creado exitosamente!'
    });
});

// Obtener todos los pedidos
app.get('/api/orders', (req, res) => {
    res.json({
        success: true,
        count: orders.length,
        data: orders
    });
});

// Obtener pedido por ID
app.get('/api/orders/:id', (req, res) => {
    const order = orders.find(o => o.id === parseInt(req.params.id));
    
    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Pedido no encontrado'
        });
    }

    res.json({
        success: true,
        data: order
    });
});

// Actualizar estado del pedido
app.put('/api/orders/:id/status', (req, res) => {
    const { status } = req.body;
    const validStatus = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];

    if (!validStatus.includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Estado inválido. Estados válidos: ' + validStatus.join(', ')
        });
    }

    const order = orders.find(o => o.id === parseInt(req.params.id));
    
    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Pedido no encontrado'
        });
    }

    order.status = status;

    res.json({
        success: true,
        data: order,
        message: `Estado actualizado a: ${status}`
    });
});

// ===== RUTA DE PRUEBA =====
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API funcionando correctamente',
        timestamp: new Date().toISOString(),
        stats: {
            products: products.length,
            orders: orders.length
        }
    });
});

// ===== MANEJO DE ERRORES =====
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

// ===== INICIAR SERVIDOR =====
app.listen(PORT, () => {
    console.log(`☕ Aurora's N Coffee API corriendo en http://localhost:${PORT}`);
    console.log(`📦 ${products.length} productos disponibles`);
    console.log(`📋 Endpoints:`);
    console.log(`   GET  /api/products       - Ver productos`);
    console.log(`   POST /api/products       - Crear producto`);
    console.log(`   GET  /api/products/:id   - Ver producto`);
    console.log(`   POST /api/orders         - Crear pedido`);
    console.log(`   GET  /api/orders         - Ver pedidos`);
    console.log(`   PUT  /api/orders/:id/status - Actualizar estado`);
    console.log(`   GET  /api/test           - Probar API`);
});

// ===== NUEVO ENDPOINT: Menú del día =====
app.get('/api/menu-del-dia', (req, res) => {
    const menuDelDia = {
        fecha: new Date().toISOString().split('T')[0],
        especial: {
            nombre: "Café de Olla",
            precio: 40,
            descripcion: "Café tradicional con canela y piloncillo"
        },
        promociones: [
            { nombre: "Combo desayuno", precio: 75, incluye: "Café + Sandwich" },
            { nombre: "2x1 en Lattes", precio: 45, horario: "3pm - 5pm" }
        ]
    };

    res.json({
        success: true,
        data: menuDelDia
    });
});