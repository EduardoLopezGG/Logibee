const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());


// Registro de Usuario (Padre)
app.post('/api/auth/register', async (req, res) => {
    const { fullname, email, password } = req.body;
    try {
        // Creamos el usuario junto con su configuración parental por defecto
        const newUser = await prisma.user.create({
            data: {
                name: fullname,
                email: email,
                password: password, // NOTA: Para producción real, encriptar con bcryptjs
                tipo: 'padre',
                language: 'es'
            }
        });
        res.status(201).json({ success: true, user: { id: newUser.id, name: newUser.name, email: newUser.email } });
    } catch (error) {
        console.error("Error al registrar:", error);
        res.status(400).json({ success: false, error: "El correo electrónico ya está registrado." });
    }
});

// Inicio de Sesión (Padre)
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || user.password !== password) {
            return res.status(401).json({ success: false, error: "Credenciales incorrectas" });
        }

        res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ success: false, error: "Error en el servidor" });
    }
});


// Obtener perfiles de niños de un usuario
app.get('/api/users/:userId/profiles', async (req, res) => {
    const { userId } = req.params;
    try {
        const profiles = await prisma.childProfile.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' }
        });
        res.json(profiles);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener perfiles" });
    }
});

// Crear perfil de niño
app.post('/api/users/:userId/profiles', async (req, res) => {
    const { userId } = req.params;
    const { nombre, edad, avatar, nivelActual } = req.body;
    try {
        // Convertimos nivel (p. ej., principiante=1, intermedio=2, avanzado=3)
        const numericLevel = nivelActual === 'avanzado' ? 3 : (nivelActual === 'intermedio' ? 2 : 1);

        const newProfile = await prisma.childProfile.create({
            data: {
                userId,
                nombre,
                edad: parseInt(edad) || 6,
                avatar,
                nivelActual: numericLevel,
                totalStars: 0,
                streakDays: 0
            }
        });

        // Crear una configuración parental por defecto asociada a este perfil de niño
        await prisma.parentalConfig.create({
            data: {
                userId,
                profileId: newProfile.id,
                limiteTiempoMin: 30,
                nivelMaxPermitido: 5,
                sonido: true,
                musica: true
            }
        });

        res.status(201).json(newProfile);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: "No se pudo crear el perfil (puede que el nombre ya exista)" });
    }
});

// Eliminar un perfil de niño
app.delete('/api/profiles/:profileId', async (req, res) => {
    const { profileId } = req.params;
    try {
        await prisma.childProfile.delete({
            where: { id: profileId }
        });
        res.json({ success: true, message: "Perfil eliminado con éxito" });
    } catch (error) {
        res.status(400).json({ error: "No se pudo eliminar el perfil" });
    }
});


// Iniciar una sesión de juego
app.post('/api/sessions/start', async (req, res) => {
    const { profileId, moduleType, levelNumber } = req.body;
    try {
        // Encontrar o crear un nivel con esta dificultad para guardar la sesión
        const level = await prisma.level.upsert({
            where: {
                moduleType_numeroNivel: {
                    moduleType,
                    numeroNivel: levelNumber || 1
                }
            },
            update: {},
            create: {
                moduleType,
                numeroNivel: levelNumber || 1,
                nombre: `Nivel ${levelNumber || 1} de ${moduleType}`,
                dificultad: levelNumber || 1
            }
        });

        const newSession = await prisma.session.create({
            data: {
                profileId,
                levelId: level.id,
                moduleType,
                questions: {}, // JSON de preguntas
                status: 'in_progress'
            }
        });

        res.status(201).json(newSession);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "No se pudo iniciar la sesión" });
    }
});

// Finalizar sesión y registrar progreso de juego
app.post('/api/sessions/end', async (req, res) => {
    const { sessionId, correctAnswers, totalQuestions, starsEarned } = req.body;
    try {
        const session = await prisma.session.update({
            where: { id: sessionId },
            data: {
                status: 'completed',
                correctAnswers: parseInt(correctAnswers),
                totalQuestions: parseInt(totalQuestions),
                starsEarned: parseInt(starsEarned),
                fechaFin: new Date(),
                duracionSeg: 120 // Simulación de tiempo estimado
            }
        });

        // Sumar las estrellas ganadas al perfil del niño
        const profile = await prisma.childProfile.update({
            where: { id: session.profileId },
            data: {
                totalStars: {
                    increment: parseInt(starsEarned)
                },
                lastActivityDate: new Date()
            }
        });

        // Registrar un registro de Progreso
        await prisma.progress.create({
            data: {
                profileId: session.profileId,
                levelId: session.levelId,
                sessionId: session.id,
                moduleType: session.moduleType,
                intentos: parseInt(totalQuestions),
                aciertos: parseInt(correctAnswers),
                completada: true,
                starsEarned: parseInt(starsEarned)
            }
        });

        res.json({ success: true, updatedStars: profile.totalStars });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "No se pudo registrar el progreso final" });
    }
});

// Iniciar servidor local
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor de la Abejita corriendo en http://localhost:${PORT}`);
});