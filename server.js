require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcryptjs = require('bcryptjs');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Verificar DATABASE_URL
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error("\n⚠️ ERROR: La variable DATABASE_URL no está definida en tu archivo .env");
    process.exit(1);
}

// Configurar Prisma
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ============================================
// RUTAS HTML
// ============================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/profiles', (req, res) => {
    res.sendFile(path.join(__dirname, 'profiles.html'));
});

app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'settings.html'));
});

app.get('/games', (req, res) => {
    res.sendFile(path.join(__dirname, 'games.html'));
});

// ============================================
// API - AUTENTICACIÓN
// ============================================

// REGISTRO (sin hash, texto plano)
app.post('/api/auth/register', async (req, res) => {
    const { fullname, email, password } = req.body;
    
    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                error: 'Este correo ya está registrado en el panal.' 
            });
        }

        const user = await prisma.user.create({
            data: {
                name: fullname,
                email,
                password: password
            }
        });

        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json({ success: true, user: userWithoutPassword });
        
    } catch (error) {
        console.error("❌ Error en registro:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// LOGIN (funciona con hash Y texto plano)
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                error: 'El correo o la contraseña son incorrectos.' 
            });
        }

        let isValid = false;

        // Detectar si es hash (bcrypt empieza con $2)
        if (user.password.startsWith('$2')) {
            console.log('🔐 Contraseña es hash, usando bcrypt.compare');
            isValid = await bcryptjs.compare(password, user.password);
        } else {
            console.log('📝 Contraseña es texto plano, comparando directamente');
            isValid = (user.password === password);
        }

        console.log('✅ ¿Contraseña válida?:', isValid);

        if (!isValid) {
            return res.status(401).json({ 
                success: false, 
                error: 'El correo o la contraseña son incorrectos.' 
            });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.json({ success: true, user: userWithoutPassword });
        
    } catch (error) {
        console.error("❌ Error en login:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// API - PERFILES DE NIÑOS
// ============================================

app.get('/api/users/:userId/profiles', async (req, res) => {
    const { userId } = req.params;
    try {
        const profiles = await prisma.childProfile.findMany({ where: { userId } });
        res.json({ success: true, profiles });
    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/profiles', async (req, res) => {
    const { userId, nombre, edad, avatar } = req.body;
    try {
        const parentUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!parentUser) {
            return res.status(404).json({ success: false, error: 'Usuario padre no encontrado.' });
        }

        const profile = await prisma.childProfile.create({
            data: {
                userId,
                nombre,
                edad: parseInt(edad),
                avatar,
                parentalConfig: { create: {} }
            }
        });
        res.status(201).json({ success: true, profile });
    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/profiles/:profileId', async (req, res) => {
    const { profileId } = req.params;
    try {
        await prisma.childProfile.delete({ where: { id: profileId } });
        res.json({ success: true });
    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
    console.log(`\n🐝 Servidor corriendo en: http://localhost:${PORT}`);
    console.log(`   Login:      http://localhost:${PORT}/login`);
    console.log(`   Registro:   http://localhost:${PORT}/register\n`);
});