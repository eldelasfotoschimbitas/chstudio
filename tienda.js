// Moneda (COP/USD), ventana de compra y botón para subir.
(() => {
  const fmt = {
    cop: (n) => "$" + Number(n).toLocaleString("es-CO"),
    usd: (n) => "US$" + Number(n).toLocaleString("en-US"),
  };
  let moneda = "cop";
  try {
    const guardada = localStorage.getItem("chs-moneda");
    if (guardada === "usd" || guardada === "cop") moneda = guardada;
    else if (navigator.language && !navigator.language.toLowerCase().startsWith("es")) moneda = "usd";  // visitas de otros idiomas ven dólares
  } catch (_) {}

  function pintarPrecios() {
    document.querySelectorAll(".pr").forEach((el) => {
      el.querySelector("s").textContent = fmt[moneda](el.dataset[moneda + "0"]);
      el.querySelector("b").textContent = fmt[moneda](el.dataset[moneda]);
    });
    document.querySelectorAll("[data-moneda]").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.moneda === moneda)));
    document.querySelectorAll(".intl").forEach((x) => (x.hidden = moneda !== "usd"));
    if (actual) llenarDialogo();
  }

  document.querySelectorAll("[data-moneda]").forEach((b) =>
    b.addEventListener("click", () => {
      moneda = b.dataset.moneda;
      try { localStorage.setItem("chs-moneda", moneda); } catch (_) {}
      pintarPrecios();
    }));

  // ---- compra ----
  const dlg = document.getElementById("compra");
  const campo = dlg && dlg.querySelector("#codigo");
  const wa = dlg && dlg.querySelector("#enviar-wa");
  let actual = null;

  function mensaje() {
    const codigo = campo.value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20);
    const precio = fmt[moneda](actual[moneda]);
    const txt = `Hola, quiero comprar ${actual.nombre} (${precio}${moneda === "usd" ? ", pago desde fuera de Colombia" : ""}).\n` +
      `Mi código de equipo es: ${codigo || "(lo envío en un momento)"}\n` +
      `¿Me envías los datos para pagar?`;
    wa.href = `https://wa.me/${window.CH.wa}?text=${encodeURIComponent(txt)}`;
  }

  function llenarDialogo() {
    dlg.querySelectorAll('[data-c="nombre"]').forEach((x) => (x.textContent = actual.nombre));
    dlg.querySelector('[data-c="antes"]').textContent = fmt[moneda](actual[moneda + "0"]);
    dlg.querySelector('[data-c="precio"]').textContent = fmt[moneda](actual[moneda]);
    dlg.querySelector('[data-c="precio2"]').textContent = fmt[moneda](actual[moneda]);
    dlg.querySelector('[data-c="mb"]').textContent = actual.mb;
    dlg.querySelector('[data-c="descarga"]').href = window.CH.descarga + actual.archivo;
    mensaje();
  }

  if (dlg) {
    try { campo.value = localStorage.getItem("chs-codigo") || ""; } catch (_) {}
    document.querySelectorAll("[data-comprar]").forEach((b) => {
      b.addEventListener("click", () => {
        const d = b.dataset;
        actual = { nombre: d.nombre, cop: d.cop, usd: d.usd, cop0: d.cop0, usd0: d.usd0, archivo: d.archivo, mb: d.mb };
        llenarDialogo();
        dlg.showModal();
      });
    });
    campo.addEventListener("input", () => {
      try { localStorage.setItem("chs-codigo", campo.value.trim()); } catch (_) {}
      mensaje();
    });
    dlg.addEventListener("click", (ev) => { if (ev.target === dlg) dlg.close(); });
  }

  // ---- subir ----
  const subir = document.querySelector(".subir");
  if (subir) {
    const ver = () => subir.classList.toggle("ver", window.scrollY > 700);
    window.addEventListener("scroll", ver, { passive: true });
    ver();
    subir.addEventListener("click", (ev) => { ev.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  pintarPrecios();
})();
