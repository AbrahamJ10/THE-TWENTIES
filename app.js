const express = require("express");
const path = require("path");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// 🔗 Conexión a Neon
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

// ============================================================
// 🔐 LOGIN
// ============================================================
app.post("/login", async (req, res) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password)
      return res.status(400).json({ message: "Faltan credenciales" });

    const result = await pool.query("SELECT * FROM usuarios WHERE username = $1", [usuario]);
    if (result.rows.length === 0)
      return res.status(401).json({ message: "Usuario no encontrado" });

    const user = result.rows[0];
<<<<<<< HEAD

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
=======
    if (password !== user.password)
      return res.status(401).json({ message: "Contraseña incorrecta" });
>>>>>>> 0db78b2 (vercion 1)

    res.status(200).json({
      message: "✅ Acceso permitido",
      cargo_id: user.cargo_id,
      redirect: "/dashboard/almacen.html",
    });
  } catch (error) {
    console.error("💥 Error en login:", error.message);
    res.status(500).json({ message: "Error interno del servidor: " + error.message });
  }
});

<<<<<<< HEAD
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
=======
// ============================================================
// 📦 CRUD DEL ALMACÉN
// ============================================================

// 🔹 Obtener productos
>>>>>>> 0db78b2 (vercion 1)
app.get("/api/almacen", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id_almacen, a.fecha, a.nombre, a.descripcion,
<<<<<<< HEAD
             cat.nombre_categoria AS categoria, sub.nombre_subcategoria AS subcategoria,
=======
             cat.nombre_categoria AS categoria,
             sub.nombre_subcategoria AS subcategoria,
>>>>>>> 0db78b2 (vercion 1)
             a.stock, a.costo, a.imagen_ruta
      FROM almacen a
      LEFT JOIN categorias cat ON a.categoria_id = cat.categoria_id
      LEFT JOIN subcategorias sub ON a.subcategoria_id = sub.subcategoria_id
      ORDER BY a.id_almacen ASC
    `);
    res.json(result.rows);
  } catch (err) {
<<<<<<< HEAD
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
=======
    console.error("❌ Error al obtener productos:", err);
    res.status(500).json({ error: "Error al obtener productos" });
  }
>>>>>>> 0db78b2 (vercion 1)
});

// 🔹 Agregar producto
app.post("/api/almacen", async (req, res) => {
  try {
    const { nombre, descripcion, categoria_id, subcategoria_id, stock, costo, imagen_ruta } = req.body;
    await pool.query(
      `INSERT INTO almacen (nombre, descripcion, categoria_id, subcategoria_id, stock, costo, fecha, imagen_ruta)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)`,
      [nombre, descripcion, categoria_id, subcategoria_id, stock, costo, imagen_ruta]
    );
    res.json({ mensaje: "✅ Producto agregado correctamente" });
  } catch (err) {
    console.error("❌ Error al agregar producto:", err);
    res.status(500).json({ error: "Error al agregar producto" });
  }
});

// 🔹 Editar producto
app.put("/api/almacen/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, categoria_id, subcategoria_id, stock, costo, imagen_ruta } = req.body;
    await pool.query(
      `UPDATE almacen
       SET nombre=$1, descripcion=$2, categoria_id=$3, subcategoria_id=$4, stock=$5, costo=$6, imagen_ruta=$7
       WHERE id_almacen=$8`,
      [nombre, descripcion, categoria_id, subcategoria_id, stock, costo, imagen_ruta, id]
    );
    res.json({ mensaje: "✏️ Producto actualizado correctamente" });
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
// 👤 CRUD DE USUARIOS
// ============================================================
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
    console.error(err);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

// ============================================================
// 🌐 SERVIR LA PÁGINA PRINCIPAL (index.html)
// ============================================================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Manejar cualquier otra ruta desconocida (útil para SPA o refresh)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// 🚀 Iniciar servidor
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
