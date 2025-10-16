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
app.use(express.static(path.join(__dirname, "public"))); // Sirve todos los archivos en /public
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

    // 🔐 Comparación de contraseña (usa la versión según tu caso)
    // Si las contraseñas NO están cifradas:
    if (password !== user.password) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    // Si están cifradas con bcrypt, usa esto:
    // const isMatch = await bcrypt.compare(password, user.password);
    // if (!isMatch) return res.status(401).json({ message: "Contraseña incorrecta" });

    // 🔁 Redirección controlada
    res.status(200).json({
      message: "✅ Acceso permitido",
      cargo_id: user.cargo_id,
      redirect: "/dashboard/almacen.html" // redirección estándar
    });

  } catch (error) {
    console.error("💥 Error en login:", error.message);
    res.status(500).json({ message: "Error interno del servidor: " + error.message });
  }
});

// 📋 Obtener lista de usuarios
app.get("/api/usuarios", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.usuario_id, u.nombre, u.apellido, u.correo, c.nombre_cargo AS cargo,
             u.username, u.password
      FROM usuarios u
      JOIN cargos c ON u.cargo_id = c.cargo_id
      ORDER BY u.usuario_id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

// 📦 Obtener lista de productos (almacén)
app.get("/api/almacen", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id_almacen, a.fecha, a.nombre, a.descripcion,
             cat.nombre_categoria AS categoria, sub.nombre_subcategoria AS subcategoria,
             a.stock, a.costo, a.imagen_ruta
      FROM almacen a
      LEFT JOIN categorias cat ON a.categoria_id = cat.categoria_id
      LEFT JOIN subcategorias sub ON a.subcategoria_id = sub.subcategoria_id
      ORDER BY a.id_almacen ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

// ⚙️ Obtener configuración (cargos, categorías y subcategorías)
app.get("/api/configuracion", async (req, res) => {
  try {
    const cargos = await pool.query("SELECT * FROM cargos ORDER BY cargo_id");
    const categorias = await pool.query("SELECT * FROM categorias ORDER BY categoria_id");
    const subcategorias = await pool.query("SELECT * FROM subcategorias ORDER BY subcategoria_id");
    res.json({
      cargos: cargos.rows,
      categorias: categorias.rows,
      subcategorias: subcategorias.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener configuraciones" });
  }
});

// 🚀 Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
