// ============================================================
// 🌐 THE TWTIES - Servidor Express con PostgreSQL (Neon)
// ============================================================

const express = require("express");
const path = require("path");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const multer = require("multer");
require("dotenv").config();

const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "the_twties", // 📁 carpeta en Cloudinary
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage });

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// 🔗 Conexión a Neon
// ============================================================
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
  ssl: { rejectUnauthorized: false },
});

pool
  .connect()
  .then(() => console.log("✅ Conectado a PostgreSQL (Neon)"))
  .catch((err) =>
    console.error("❌ Error al conectar a PostgreSQL:", err.message)
  );

// ============================================================
// ⚙️ Middleware
// ============================================================
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ============================================================
// ❤️ Health Check
// ============================================================
app.get("/health", (req, res) => res.status(200).send("OK"));

// ============================================================
// 🔐 LOGIN
// ============================================================
app.post("/login", async (req, res) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password)
      return res.status(400).json({ message: "Faltan credenciales" });

    const result = await pool.query(
      "SELECT * FROM usuarios WHERE username = $1",
      [usuario]
    );

    if (result.rows.length === 0)
      return res.status(401).json({ message: "Usuario no encontrado" });

    const user = result.rows[0];
    if (password !== user.password) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    res.status(200).json({
      message: "✅ Acceso permitido",
      cargo_id: user.cargo_id,
      redirect: "/dashboard/almacen.html",
    });
  } catch (error) {
    console.error("💥 Error en login:", error.message);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// ============================================================
// 📸 Configuración de subida de imágenes con Multer
// ============================================================
// 📸 Configuración de subida de imágenes con Multer

// ============================================================
// 📦 CRUD DEL ALMACÉN (con soporte de imagen)
// ============================================================

// 🔹 Obtener productos
app.get("/api/almacen", async (req, res) => {
  try {
    const query = `
      SELECT 
        a.id_almacen,
        a.fecha,
        a.nombre,
        a.descripcion,
        a.stock,
        a.costo,
        a.imagen_ruta,
        c.categoria_id,
        c.nombre_categoria AS categoria,
        s.subcategoria_id,
        s.nombre_subcategoria AS subcategoria
      FROM almacen a
      LEFT JOIN categorias c ON a.categoria_id = c.categoria_id
      LEFT JOIN subcategorias s ON a.subcategoria_id = s.subcategoria_id
      ORDER BY a.id_almacen ASC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener productos:", err);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

// 🔹 Agregar producto (con imagen)
app.post("/api/almacen", upload.single("imagen"), async (req, res) => {
  try {
    const { nombre, descripcion, categoria_id, subcategoria_id, stock, costo } =
      req.body;
    const imagen_ruta = req.file ? req.file.path : null;

    await pool.query(
      `INSERT INTO almacen (nombre, descripcion, categoria_id, subcategoria_id, stock, costo, fecha, imagen_ruta)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)`,
      [
        nombre,
        descripcion,
        categoria_id,
        subcategoria_id,
        stock,
        costo,
        imagen_ruta,
      ]
    );

    res.json({ mensaje: "✅ Producto agregado correctamente" });
  } catch (err) {
    console.error("❌ Error al agregar producto:", err);
    res.status(500).json({ error: "Error al agregar producto" });
  }
});

// 🔹 Editar producto (imagen opcional)
app.put("/api/almacen/:id", upload.single("imagen"), async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    descripcion,
    categoria_id,
    subcategoria_id,
    stock,
    costo,
    fecha,
  } = req.body;

  try {
    let imagenUrl;

    // Si se subió una nueva imagen a Cloudinary
    if (req.file && req.file.path) {
      imagenUrl = req.file.path; // ✅ URL de Cloudinary
    }

    // Obtener la imagen actual desde la BD
    const result = await pool.query(
      "SELECT imagen_ruta FROM almacen WHERE id_almacen = $1",
      [id]
    );
    const imagenActual = result.rows[0]?.imagen_ruta;

    // Usar la actual si no se subió nueva
    const imagenFinal = imagenUrl || imagenActual;

    // Actualizar producto
    await pool.query(
      `UPDATE almacen
       SET nombre = $1,
           descripcion = $2,
           categoria_id = $3,
           subcategoria_id = $4,
           stock = $5,
           costo = $6,
           fecha = $7,
           imagen_ruta = $8
       WHERE id_almacen = $9`,
      [
        nombre,
        descripcion,
        categoria_id,
        subcategoria_id,
        stock,
        costo,
        fecha || new Date(),
        imagenFinal,
        id,
      ]
    );

    res.json({ mensaje: "✅ Producto actualizado correctamente" });
  } catch (err) {
    console.error("❌ Error al actualizar producto:", err);
    res.status(500).json({ error: "Error al actualizar producto" });
  }
});

// 🔹 Eliminar producto
app.delete("/api/almacen/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM almacen WHERE id_almacen=$1", [id]);
    res.json({ mensaje: "🗑️ Producto eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error al eliminar producto:", err);
    res.status(500).json({ error: "Error al eliminar producto" });
  }
});

// ============================================================
// 👤 CRUD COMPLETO DE USUARIOS
// ============================================================

// 🔹 Obtener usuarios
app.get("/api/usuarios", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.usuario_id, u.nombre, u.apellido, u.correo, 
             c.nombre_cargo AS cargo, u.username, u.password
      FROM usuarios u
      JOIN cargos c ON u.cargo_id = c.cargo_id
      ORDER BY u.usuario_id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener usuarios:", err);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

// ➕ Agregar usuario
app.post("/api/usuarios", async (req, res) => {
  try {
    const { nombre, apellido, correo, cargo_id, username, password } = req.body;
    await pool.query(
      `INSERT INTO usuarios (nombre, apellido, correo, cargo_id, username, password)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [nombre, apellido, correo, cargo_id, username, password]
    );
    res.json({ mensaje: "✅ Usuario agregado correctamente" });
  } catch (err) {
    console.error("❌ Error al agregar usuario:", err);
    res.status(500).json({ error: "Error al agregar usuario" });
  }
});

// ✏️ Editar usuario
app.put("/api/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, correo, cargo_id, username, password } = req.body;

    await pool.query(
      `UPDATE usuarios
       SET nombre=$1, apellido=$2, correo=$3, cargo_id=$4, username=$5, password=$6
       WHERE usuario_id=$7`,
      [nombre, apellido, correo, cargo_id, username, password, id]
    );

    res.json({ mensaje: "✏️ Usuario actualizado correctamente" });
  } catch (err) {
    console.error("❌ Error al actualizar usuario:", err);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

// 🗑️ Eliminar usuario
app.delete("/api/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM usuarios WHERE usuario_id=$1", [id]);
    res.json({ mensaje: "🗑️ Usuario eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error al eliminar usuario:", err);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
});

// ============================================================
// ⚙️ CONFIGURACIÓN (CARGOS, CATEGORÍAS, SUBCATEGORÍAS)
// ============================================================

// 🔹 Obtener CARGOS
app.get("/api/cargos", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM cargos ORDER BY cargo_id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener cargos:", err);
    res.status(500).json({ error: "Error al obtener cargos" });
  }
});

// 🔹 Obtener CATEGORÍAS
app.get("/api/categorias", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM categorias ORDER BY categoria_id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener categorías:", err);
    res.status(500).json({ error: "Error al obtener categorías" });
  }
});

// 🔹 Obtener SUBCATEGORÍAS
app.get("/api/subcategorias", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM subcategorias ORDER BY subcategoria_id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener subcategorías:", err);
    res.status(500).json({ error: "Error al obtener subcategorías" });
  }
});

// 🔹 Agregar registro (Cargo / Categoría / Subcategoría)
app.post("/api/:tipo", async (req, res) => {
  try {
    const { tipo } = req.params;
    const { nombre } = req.body;

    const tablas = {
      cargos: { tabla: "cargos", columna: "nombre_cargo" },
      categorias: { tabla: "categorias", columna: "nombre_categoria" },
      subcategorias: { tabla: "subcategorias", columna: "nombre_subcategoria" },
    };

    const info = tablas[tipo];
    if (!info) return res.status(400).json({ error: "Tipo no válido" });

    await pool.query(
      `INSERT INTO ${info.tabla} (${info.columna}) VALUES ($1)`,
      [nombre]
    );
    res.json({ mensaje: "✅ Registro agregado correctamente" });
  } catch (err) {
    console.error("❌ Error al agregar registro:", err);
    res.status(500).json({ error: "Error al agregar registro" });
  }
});

// 🔹 Eliminar registro
app.delete("/api/:tipo/:id", async (req, res) => {
  try {
    const { tipo, id } = req.params;

    const tablas = {
      cargos: { tabla: "cargos", id: "cargo_id" },
      categorias: { tabla: "categorias", id: "categoria_id" },
      subcategorias: { tabla: "subcategorias", id: "subcategoria_id" },
    };

    const info = tablas[tipo];
    if (!info) return res.status(400).json({ error: "Tipo no válido" });

    await pool.query(`DELETE FROM ${info.tabla} WHERE ${info.id} = $1`, [id]);
    res.json({ mensaje: "🗑️ Registro eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error al eliminar registro:", err);
    res.status(500).json({ error: "Error al eliminar registro" });
  }
});

// ============================================================
// 🌐 SERVIR LA PÁGINA PRINCIPAL
// ============================================================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Fallback SPA
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ============================================================
// 🚀 Iniciar servidor
// ============================================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
