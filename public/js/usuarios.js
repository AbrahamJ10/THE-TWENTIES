// public/js/usuarios.js
const API_USUARIOS = "/api/usuarios";
const API_CARGOS = "/api/cargos"; // endpoint para obtener cargos {cargo_id, nombre_cargo}

const tbodyU = document.querySelector("#tablaUsuarios tbody");
const modalContainer = document.getElementById("modalContainer");
const btnAgregarU = document.getElementById("btnAgregarUsuario");

let cargosCache = [];

// cargar cargos al inicio (no bloqueante)
async function cargarCargos() {
  try {
    const res = await fetch(API_CARGOS);
    if (!res.ok) throw new Error("No se pudo cargar cargos");
    cargosCache = await res.json();
  } catch (err) {
    console.warn("No se pudieron cargar cargos:", err);
    cargosCache = []; // fallback
  }
}

// =======================
// Cargar usuarios
// =======================
function cargarUsuarios() {
  fetch(API_USUARIOS)
    .then(res => res.json())
    .then(data => {
      tbodyU.innerHTML = "";
      data.forEach(u => {
        const tr = document.createElement("tr");
        tr.dataset.id = u.usuario_id;
        tr.innerHTML = `
          <td>${u.nombre}</td>
          <td>${u.apellido}</td>
          <td>${u.correo}</td>
          <td>${u.cargo}</td>
          <td>${u.username}</td>
          <td>${u.password}</td>
          <td><button class="btn editar" onclick="abrirModalUsuario(${u.usuario_id}, 'editar')">✏️ Editar</button></td>
          <td><button class="btn eliminar" onclick="eliminarUsuario(${u.usuario_id})">🗑️ Eliminar</button></td>
        `;
        tbodyU.appendChild(tr);
      });
    })
    .catch(err => console.error("Error al cargar usuarios:", err));
}

// =======================
// Modal dinámico (ahora con select de cargos)
// =======================
async function abrirModalUsuario(id = null, modo = "agregar") {
  // ensure cargos are loaded
  if (!cargosCache.length) await cargarCargos();

  let valores = { nombre: "", apellido: "", correo: "", cargo_id: "", username: "", password: "" };

  if (id) {
    // obtener desde backend el usuario (puede reutilizar /api/usuarios)
    const res = await fetch(API_USUARIOS);
    const data = await res.json();
    const usuario = data.find(u => u.usuario_id == id);
    if (!usuario) {
      alert("Usuario no encontrado");
      return;
    }
    valores = {
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      cargo_id: usuario.cargo_id || "",
      username: usuario.username,
      password: usuario.password
    };
  }

  // construir options de cargos (texto visible, value = cargo_id)
  const optionsCargos = cargosCache.map(c => `<option value="${c.cargo_id}" ${c.cargo_id == valores.cargo_id ? "selected" : ""}>${c.nombre_cargo}</option>`).join("\n");

  modalContainer.innerHTML = `
    <div class="modal-overlay">
      <div class="modal">
        <button class="cerrar" onclick="cerrarModal()">×</button>
        <h2>${modo === "editar" ? "Editar Usuario" : "Agregar Usuario"}</h2>
        <form id="formUsuario">
          <div><label>Nombre</label><input name="nombre" value="${valores.nombre}" required></div>
          <div><label>Apellido</label><input name="apellido" value="${valores.apellido}" required></div>
          <div><label>Correo</label><input name="correo" type="email" value="${valores.correo}" required></div>
          <div>
            <label>Cargo</label>
            <select name="cargo_id" required>
              <option value="">-- Selecciona cargo --</option>
              ${optionsCargos}
            </select>
          </div>
          <div><label>Username</label><input name="username" value="${valores.username}" required></div>
          <div><label>Password</label><input name="password" value="${valores.password}" required></div>
          <div class="acciones">
            <button type="submit" class="btn agregar">Guardar</button>
            <button type="button" class="btn eliminar" onclick="cerrarModal()">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const form = document.getElementById("formUsuario");
  form.onsubmit = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    // enviar cargo_id como número
    data.cargo_id = Number(data.cargo_id || 0);

    fetch(id ? `${API_USUARIOS}/${id}` : API_USUARIOS, {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(async res => {
        const respuesta = await res.json();
        if (res.ok) {
          alert(respuesta.mensaje || "Guardado correctamente");
          cerrarModal();
          cargarUsuarios();
        } else {
          alert("❌ Error: " + (respuesta.error || "No se pudo guardar"));
        }
      })
      .catch(err => console.error("Error al guardar usuario:", err));
  };
}

function cerrarModal() {
  modalContainer.innerHTML = "";
}

// =======================
// Eliminar usuario
// =======================
function eliminarUsuario(id) {
  if (confirm("¿Eliminar este usuario?")) {
    fetch(`${API_USUARIOS}/${id}`, { method: "DELETE" })
      .then(async res => {
        const respuesta = await res.json();
        if (res.ok) {
          alert(respuesta.mensaje || "Eliminado");
          cargarUsuarios();
        } else {
          alert("❌ Error al eliminar usuario");
        }
      })
      .catch(err => console.error("Error al eliminar usuario:", err));
  }
}

btnAgregarU.onclick = () => abrirModalUsuario();
cargarCargos(); // preload cargos
cargarUsuarios();
