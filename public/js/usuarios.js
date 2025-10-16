const API_USUARIOS = "/api/usuarios";
const tbodyU = document.querySelector("#tablaUsuarios tbody");
const modalContainer = document.getElementById("modalContainer");
const btnAgregarU = document.getElementById("btnAgregarUsuario");

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
          <td><button class="btn editar" onclick="abrirModalUsuario(${u.usuario_id}, 'editar')">Editar</button></td>
          <td><button class="btn eliminar" onclick="eliminarUsuario(${u.usuario_id})">Eliminar</button></td>
        `;
        tbodyU.appendChild(tr);
      });
    });
}

// =======================
// Modal dinámico
// =======================
function abrirModalUsuario(id = null, modo = "agregar") {
  const usuario = id
    ? Array.from(tbodyU.children).find(tr => tr.dataset.id == id)
    : null;

  const valores = usuario
    ? {
        nombre: usuario.children[0].textContent,
        apellido: usuario.children[1].textContent,
        correo: usuario.children[2].textContent,
        cargo_id: usuario.children[3].textContent,
        username: usuario.children[4].textContent,
        password: usuario.children[5].textContent,
      }
    : { nombre: "", apellido: "", correo: "", cargo_id: "", username: "", password: "" };

  modalContainer.innerHTML = `
    <div class="modal-overlay">
      <div class="modal">
        <button class="cerrar" onclick="cerrarModal()">×</button>
        <h2>${modo === "editar" ? "Editar Usuario" : "Agregar Usuario"}</h2>
        <form id="formUsuario">
          <div><label>Nombre</label><input name="nombre" value="${valores.nombre}" required></div>
          <div><label>Apellido</label><input name="apellido" value="${valores.apellido}" required></div>
          <div><label>Correo</label><input name="correo" type="email" value="${valores.correo}" required></div>
          <div><label>Cargo</label><input name="cargo_id" value="${valores.cargo_id}" required></div>
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

    fetch(id ? `${API_USUARIOS}/${id}` : API_USUARIOS, {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    .then(() => {
      cerrarModal();
      cargarUsuarios();
    });
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
      .then(() => cargarUsuarios());
  }
}

btnAgregarU.onclick = () => abrirModalUsuario();
cargarUsuarios();
