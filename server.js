require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcryptjs = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const prisma = new PrismaClient();

// ============================================
// RUTAS HTML
// ============================================

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'register.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'dashboard.html')));
app.get('/profiles', (req, res) => res.sendFile(path.join(__dirname, 'profiles.html')));
app.get('/settings', (req, res) => res.sendFile(path.join(__dirname, 'settings.html')));
app.get('/games', (req, res) => res.sendFile(path.join(__dirname, 'games.html')));

// ============================================
// API - AUTENTICACIÓN
// ============================================

// REGISTRO (guarda contraseña hasheada)
app.post('/api/auth/register', async (req, res) => {
    const { fullname, email, password } = req.body;
    try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ success: false, error: 'Este correo ya está registrado.' });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name: fullname,
                email,
                password: hashedPassword
            }
        });

        const { password: _, ...userWithoutPassword } = user;
        res.json({ success: true, user: userWithoutPassword });
    } catch (error) {
        console.error('❌ Error en registro:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// LOGIN (acepta texto plano Y hash)
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        
        if (!user) {
            return res.status(401).json({ success: false, error: 'Correo o contraseña incorrectos.' });
        }

        let isValid = false;

        if (user.password.startsWith('$2')) {
            console.log('🔐 Hash detectado, usando bcrypt.compare');
            isValid = await bcryptjs.compare(password, user.password);
        } else {
            console.log('📝 Texto plano, comparando directamente');
            isValid = (user.password === password);
        }

        console.log('✅ ¿Válido?:', isValid);

        if (!isValid) {
            return res.status(401).json({ success: false, error: 'Correo o contraseña incorrectos.' });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.json({ success: true, user: userWithoutPassword });
    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// API - PERFILES DE NIÑOS
// ============================================

app.get('/api/users/:userId/profiles', async (req, res) => {
    try {
        const profiles = await prisma.childProfile.findMany({
            where: { userId: req.params.userId },
            include: { parentalConfig: true }
        });
        res.json({ success: true, profiles });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/profiles', async (req, res) => {
    const { userId, nombre, edad, avatar } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
        }

        const profile = await prisma.childProfile.create({
            data: {
                userId,
                nombre,
                edad: parseInt(edad),
                avatar,
                parentalConfig: {
                    create: { userId: userId }
                }
            },
            include: { parentalConfig: true }
        });

        res.json({ success: true, profile });
    } catch (error) {
        console.error('❌ Error al crear perfil:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/profiles/:profileId', async (req, res) => {
    try {
        await prisma.childProfile.delete({ where: { id: req.params.profileId } });
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// API - CONFIGURACIÓN PARENTAL
// ============================================

app.get('/api/profiles/:profileId/config', async (req, res) => {
    try {
        const config = await prisma.parentalConfig.findUnique({
            where: { profileId: req.params.profileId }
        });
        res.json({ success: true, config });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/profiles/:profileId/config', async (req, res) => {
    const { limiteTiempoMin, nivelMaxPermitido, sonido, musica, modoNocturno, notificaciones } = req.body;
    try {
        const config = await prisma.parentalConfig.update({
            where: { profileId: req.params.profileId },
            data: {
                limiteTiempoMin,
                nivelMaxPermitido,
                sonido,
                musica,
                modoNocturno,
                notificaciones
            }
        });
        res.json({ success: true, config });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
    console.log(`\n🐝 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`   Login:      http://localhost:${PORT}/login`);
    console.log(`   Registro:   http://localhost:${PORT}/register`);
    console.log(`   Dashboard:  http://localhost:${PORT}/dashboard\n`);
});