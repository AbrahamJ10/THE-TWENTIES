// ==========================================================
// 📦 CRUD del ALMACÉN (productos)
// ==========================================================

// ➕ AGREGAR producto
app.post("/api/almacen", async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      categoria_id,
      subcategoria_id,
      stock,
      costo,
      imagen_ruta,
    } = req.body;

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
    console.error("Error al agregar producto:", err);
    res.status(500).json({ error: "Error al agregar producto" });
  }
});

// ✏️ EDITAR producto
app.put("/api/almacen/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      descripcion,
      categoria_id,
      subcategoria_id,
      stock,
      costo,
      imagen_ruta,
    } = req.body;

    await pool.query(
      `UPDATE almacen
       SET nombre=$1, descripcion=$2, categoria_id=$3, subcategoria_id=$4, stock=$5, costo=$6, imagen_ruta=$7
       WHERE id_almacen=$8`,
      [
        nombre,
        descripcion,
        categoria_id,
        subcategoria_id,
        stock,
        costo,
        imagen_ruta,
        id,
      ]
    );

    res.json({ mensaje: "✏️ Producto actualizado correctamente" });
  } catch (err) {
    console.error("Error al actualizar producto:", err);
    res.status(500).json({ error: "Error al actualizar producto" });
  }
});

// ❌ ELIMINAR producto
app.delete("/api/almacen/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM almacen WHERE id_almacen=$1", [id]);
    res.json({ mensaje: "🗑️ Producto eliminado correctamente" });
  } catch (err) {
    console.error("Error al eliminar producto:", err);
    res.status(500).json({ error: "Error al eliminar producto" });
  }
});

// ==========================================================
// 👤 CRUD de USUARIOS
// ==========================================================

// ➕ AGREGAR usuario
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
    console.error("Error al agregar usuario:", err);
    res.status(500).json({ error: "Error al agregar usuario" });
  }
});

// ✏️ EDITAR usuario
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
    console.error("Error al actualizar usuario:", err);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

// ❌ ELIMINAR usuario
app.delete("/api/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM usuarios WHERE usuario_id=$1", [id]);
    res.json({ mensaje: "🗑️ Usuario eliminado correctamente" });
  } catch (err) {
    console.error("Error al eliminar usuario:", err);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
});
