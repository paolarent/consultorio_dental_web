const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Ruta absoluta a dist/frontend
const distPath = path.join(__dirname, 'dist', 'frontend');

// Servir archivos estáticos
app.use(express.static(distPath));

// Redirección para rutas internas del SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('Frontend running on port ' + PORT);
});
