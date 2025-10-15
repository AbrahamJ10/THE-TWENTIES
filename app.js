const express = require("express");
const path = require("path");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const PORT = 3000;

// 🔗 Conexión a Neon con variables .env
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
  ssl: { rejectUnauthorized: false },
});

// 📂 Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 🧾 Ruta de login
app.post("/login", async (req, res) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password) {
      return res.status(400).json({ message: "Faltan credenciales" });
    }

    const result = await pool.query("SELECT * FROM usuarios WHERE username = $1", [usuario]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    const user = result.rows[0];

    // Si tu contraseña en la BD aún no está cifrada, usa esta comparación simple:
    if (password !== user.password) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    // Si la contraseña está cifrada con bcrypt, usarías:
    // const isMatch = await bcrypt.compare(password, user.password);
    // if (!isMatch) return res.status(401).json({ message: "Contraseña incorrecta" });

    res.json({ message: "✅ Acceso permitido", cargo_id: user.cargo_id });

  } catch (error) {
    console.error("💥 Error en login:", error.message);
    res.status(500).json({ message: "Error interno del servidor: " + error.message });
  }
});

// 🚀 Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
