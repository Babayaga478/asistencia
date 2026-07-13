const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const DB_FILE = path.join(__dirname, 'data.json');

// Inicializador de base de datos local JSON (Cero costos de infraestructura)
if (!fs.existsSync(DB_FILE)) {
    const datosIniciales = {
        listas: {
            personal: ["Juan Pérez", "María Gómez", "Carlos Rodríguez", "Ana Martínez"],
            comisiones: ["Supervisión Operativa", "Entrega de Apoyos", "Logística Territorial"],
            municipios: ["Guadalajara", "Zapopan", "Tlajomulco de Zúñiga", "Tlaquepaque", "Tonalá"]
        },
        asistencias: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(datosIniciales, null, 4));
}

app.get('/api/listas', (req, res) => {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    res.json(data.listas);
});

app.post('/api/asistencia', (req, res) => {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    const ahora = new Date();
    
    const registro = {
        id: Date.now(),
        nombre: req.body.nombre,
        comision: req.body.comision,
        municipio: req.body.municipio,
        fecha: ahora.toLocaleDateString('es-MX'),
        hora: ahora.toLocaleTimeString('es-MX'),
        latitud: req.body.latitud,
        longitud: req.body.longitud,
        foto: req.body.foto
    };

    data.asistencias.push(registro);
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 4));
    res.sendStatus(200);
});

// Endpoint de Monitoreo y Conciliación (Cruce de datos)
app.get('/api/monitoreo', (req, res) => {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    const hoy = new Date().toLocaleDateString('es-MX');

    const asistenciasHoy = data.asistencias.filter(a => a.fecha === hoy);
    const personalQueCumplio = asistenciasHoy.map(a => a.nombre);

    // CRUCE DE DATOS AUTOMÁTICO: Quienes están en el catálogo de personal pero no registraron hoy
    const omisos = data.listas.personal.filter(nombre => !personalQueCumplio.includes(nombre));

    res.json({
        fechaReporte: hoy,
        totalAsistidos: asistenciasHoy.length,
        totalFaltantes: omisos.length,
        listaOmisos: omisos,
        registrosCompletos: asistenciasHoy
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor SACI operativo en: http://localhost:${PORT}`);
});