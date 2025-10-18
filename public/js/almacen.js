// public/js/almacen.js
const API_ALMACEN = "/api/almacen";
const tbody = document.querySelector("#tablaAlmacen tbody");
const modalContainer = document.getElementById("modalContainer");
const btnAgregar = document.getElementById("btnAgregarProducto");

let productosCache = []; // cache local

// --- CARGAR y RENDERIZAR PRODUCTOS ---
async function cargarProductos() {
  try {
    const res = await fetch(API_ALMACEN);
    if (!res.ok) throw new Error("Error al obtener productos");
    const data = await res.json();
    productosCache = data;
    renderProductos(data);
  } catch (err) {
    console.error("cargarProductos:", err);
    tbody.innerHTML = `<tr><td colspan="11">Error al cargar productos</td></tr>`;
  }
}

function renderProductos(data) {
  tbody.innerHTML = "";
  if (!Array.isArray(data) || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11">No hay productos</td></tr>`;
    return;
  }

  data.forEach(p => {
    // usa las propiedades que tu backend devuelve: asumimos id_almacen, fecha, nombre, descripcion, categoria, subcategoria, stock, costo, imagen_ruta
    const id = p.id_almacen;
    const imgHtml = p.imagen_ruta ? `<img src="/${p.imagen_ruta}" width="40" alt="img">` : "—";
    const tr = document.createElement("tr");
    tr.dataset.id = id;
    tr.innerHTML = `
      <td>${id}</td>
      <td>${p.fecha || ""}</td>
      <td>${p.nombre || ""}</td>
      <td>${p.descripcion || ""}</td>
      <td>${p.categoria || ""}</td>
      <td>${p.subcategoria || ""}</td>
      <td>${p.stock ?? ""}</td>
      <td>${p.costo ?? ""}</td>
      <td>${imgHtml}</td>
      <td><button class="btn editar" data-id="${id}">✏️</button></td>
      <td><button class="btn eliminar" data-id="${id}">🗑️</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// --- ABRIR MODAL (AGREGAR / EDITAR) ---
async function abrirModal(producto = null) {
  const isEdit = !!producto;

  // 🔹 Cargar categorías y subcategorías desde el backend
let categorias = [];
let subcategorias = [];

try {
  const [resCat, resSub] = await Promise.all([
    fetch("/api/categorias"),
    fetch("/api/subcategorias")
  ]);

  if (resCat.ok) categorias = await resCat.json();
  if (resSub.ok) subcategorias = await resSub.json();
} catch (err) {
  console.error("❌ Error cargando categorías o subcategorías:", err);
}

  // Generar opciones dinámicas
  const opcionesCategoria = categorias.map(c =>
    `<option value="${c.categoria_id}" ${producto?.categoria_id == c.categoria_id ? "selected" : ""}>
      ${c.nombre_categoria}
    </option>`
  ).join("");

  const opcionesSubcategoria = subcategorias.map(s =>
    `<option value="${s.subcategoria_id}" ${producto?.subcategoria_id == s.subcategoria_id ? "selected" : ""}>
      ${s.nombre_subcategoria}
    </option>`
  ).join("");

  // 🔹 Modal HTML
  modalContainer.innerHTML = `
    <div class="modal-overlay">
      <div class="modal">
        <button class="cerrar" id="modalCerrar">×</button>
        <h2>${isEdit ? "Editar producto" : "Agregar producto"}</h2>
        <form id="formProducto" enctype="multipart/form-data">

          <!-- Código deshabilitado -->
          <div>
            <label>Código (ID)</label>
            <input name="id_almacen" value="${producto?.id_almacen || ''}" disabled>
          </div>

          <div><label>Fecha</label><input name="fecha" type="date" value="${producto?.fecha || ''}"></div>
          <div><label>Nombre</label><input name="nombre" value="${producto?.nombre || ''}" required></div>
          <div><label>Descripción</label><input name="descripcion" value="${producto?.descripcion || ''}"></div>

          <!-- Select de Categoría -->
          <div>
            <label>Categoría</label>
            <select name="categoria_id" required>
              <option value="">-- Selecciona una categoría --</option>
              ${opcionesCategoria}
            </select>
          </div>

          <!-- Select de Subcategoría -->
          <div>
            <label>Subcategoría</label>
            <select name="subcategoria_id">
              <option value="">-- Selecciona una subcategoría --</option>
              ${opcionesSubcategoria}
            </select>
          </div>

          <div><label>Stock</label><input name="stock" type="number" value="${producto?.stock ?? 0}"></div>
          <div><label>Costo</label><input name="costo" type="number" step="0.01" value="${producto?.costo ?? 0}"></div>

          <div>
            <label>Imagen (nuevo archivo)</label>
            <input type="file" name="imagen" id="inputImagen" accept="image/*">
          </div>

          <div id="previewContainer">
            ${
              producto && producto.imagen_ruta
                ? `<p>Imagen actual:</p><img src="/${producto.imagen_ruta}" id="previewImg" width="80">`
                : `<img id="previewImg" style="display:none;" width="80">`
            }
          </div>

          <div class="acciones" style="margin-top:12px;">
            <button type="submit" class="btn agregar">${isEdit ? 'Guardar cambios' : 'Agregar'}</button>
            <button type="button" class="btn eliminar" id="btnCancelar">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // === EVENTOS DE MODAL ===
  document.getElementById("modalCerrar").onclick = cerrarModal;
  document.getElementById("btnCancelar").onclick = cerrarModal;

  const inputImagen = document.getElementById("inputImagen");
  const previewImg = document.getElementById("previewImg");
  inputImagen.addEventListener("change", () => {
    const file = inputImagen.files[0];
    if (!file) {
      previewImg.style.display = 'none';
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      previewImg.src = e.target.result;
      previewImg.style.display = 'inline-block';
    };
    reader.readAsDataURL(file);
  });

  const form = document.getElementById("formProducto");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    fd.delete("id_almacen");

    const url = isEdit ? `${API_ALMACEN}/${producto.id_almacen}` : API_ALMACEN;
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, { method, body: fd });
      if (!res.ok) {
        const err = await res.json().catch(()=>({error:'error'}));
        throw new Error(err.error || 'Error guardando producto');
      }
      const json = await res.json();
      alert(json.mensaje || (isEdit ? "Producto actualizado" : "Producto agregado"));
      cerrarModal();
      cargarProductos();
    } catch (err) {
      console.error("guardar producto:", err);
      alert("Error al guardar producto, revisa consola.");
    }
  };
}



function cerrarModal() {
  modalContainer.innerHTML = "";
}

// --- ELIMINAR PRODUCTO ---
async function eliminarProducto(id) {
  if (!confirm("¿Eliminar este producto?")) return;
  try {
    const res = await fetch(`${API_ALMACEN}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Error en DELETE");
    const json = await res.json();
    alert(json.mensaje || "Eliminado correctamente");
    cargarProductos();
  } catch (err) {
    console.error("eliminarProducto:", err);
    alert("No se pudo eliminar. Revisa la consola del servidor.");
  }
}

// --- DELEGACIÓN DE EVENTOS EN TBODY (Editar / Eliminar) ---
tbody.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  if (btn.classList.contains("editar")) {
    const id = btn.dataset.id;
    const producto = productosCache.find(p => p.id_almacen == id);
    if (!producto) {
      alert("Producto no encontrado en cache");
      return;
    }
    abrirModal(producto);
  }

  if (btn.classList.contains("eliminar")) {
    const id = btn.dataset.id;
    eliminarProducto(id);
  }
});

// boton agregar (está en la tabla header)
btnAgregar.addEventListener("click", () => abrirModal(null));

// iniciar
cargarProductos();
