// Ventana de compra: llena el producto, valida el código y arma el mensaje de WhatsApp.
(() => {
  const dlg = document.getElementById("compra");
  if (!dlg) return;
  const cop = (n) => "$" + Number(n).toLocaleString("es-CO");
  const campo = dlg.querySelector("#codigo");
  const wa = dlg.querySelector("#enviar-wa");
  let actual = null;

  try { campo.value = localStorage.getItem("chs-codigo") || ""; } catch (_) {}

  function mensaje() {
    const codigo = campo.value.trim().toUpperCase();
    const txt = `Hola, quiero comprar ${actual.nombre} (${cop(actual.precio)}).\n` +
      `Mi código de equipo es: ${codigo || "(lo envío en un momento)"}\n` +
      `Adjunto el comprobante de pago.`;
    wa.href = `https://wa.me/${window.CH.wa}?text=${encodeURIComponent(txt)}`;
  }

  document.querySelectorAll("[data-comprar]").forEach((b) => {
    b.addEventListener("click", () => {
      actual = { nombre: b.dataset.nombre, precio: b.dataset.precio, archivo: b.dataset.archivo, mb: b.dataset.mb };
      dlg.querySelectorAll('[data-c="nombre"]').forEach((x) => (x.textContent = actual.nombre));
      dlg.querySelector('[data-c="precio"]').textContent = cop(actual.precio);
      dlg.querySelector('[data-c="precio2"]').textContent = cop(actual.precio);
      dlg.querySelector('[data-c="mb"]').textContent = actual.mb;
      dlg.querySelector('[data-c="descarga"]').href = window.CH.descarga + actual.archivo;
      mensaje();
      dlg.showModal();
    });
  });

  campo.addEventListener("input", () => {
    try { localStorage.setItem("chs-codigo", campo.value.trim()); } catch (_) {}
    mensaje();
  });

  dlg.querySelectorAll(".copiar").forEach((b) => {
    b.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(b.dataset.copiar);
        b.textContent = "Copiado";
      } catch (_) {
        b.textContent = "Selecciona y copia";
      }
      setTimeout(() => (b.textContent = "Copiar"), 1800);
    });
  });

  // clic fuera del cuadro = cerrar
  dlg.addEventListener("click", (ev) => { if (ev.target === dlg) dlg.close(); });
})();
