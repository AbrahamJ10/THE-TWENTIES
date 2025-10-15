document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".form-login");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const usuario = document.getElementById("usuario").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password })
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ " + data.message);
        // Redirigir a página principal o panel
        window.location.href = "index.html";
      } else {
        alert("❌ " + data.message);
      }

    } catch (error) {
      console.error("Error:", error);
      alert("Error al conectar con el servidor.");
    }
  });
});
