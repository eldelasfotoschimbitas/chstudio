// Moneda (COP/USD), compra (PC y celular), enviar link al PC y botón para subir.
(() => {
  const fmt = {
    cop: (n) => "$" + Number(n).toLocaleString("es-CO"),
    usd: (n) => "US$" + Number(n).toLocaleString("en-US"),
  };
  const ua = navigator.userAgent || "";
  // Las apps son para Windows: en celular, tablet o Mac no se descarga el .exe, se envía el link al PC.
  const enPC = /Windows NT/i.test(ua) && !/Mobile|Phone|Android/i.test(ua);
  document.documentElement.classList.add(enPC ? "es-pc" : "es-movil");

  let moneda = "cop";
  try {
    const guardada = localStorage.getItem("chs-moneda");
    if (guardada === "usd" || guardada === "cop") moneda = guardada;
    else if (navigator.language && !navigator.language.toLowerCase().startsWith("es")) moneda = "usd";
  } catch (_) {}

  let actual = null;

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

  // ---- enviar el link de descarga al PC (celular) ----
  async function enviarLink(nombre, url, boton) {
    const texto = `Instalador de ${nombre} (CH Studio) para abrir en mi PC con Windows: ${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${nombre} | CH Studio`, text: texto });
        return;
      }
    } catch (e) {
      if (e && e.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      if (boton) {
        const antes = boton.textContent;
        boton.textContent = "Link copiado";
        setTimeout(() => (boton.textContent = antes), 2000);
      }
    } catch (_) {
      window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
    }
  }

  document.querySelectorAll("[data-descarga]").forEach((a) => {
    if (enPC) return;
    a.textContent = "Enviar link a mi PC";
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      const nombre = document.querySelector("h1")?.textContent?.trim() || "CH Studio";
      enviarLink(a.dataset.descarga.includes("Suite") ? "la Suite CH Studio" : nombre, a.href, a);
    });
  });

  // ---- compra ----
  const dlg = document.getElementById("compra");
  const campo = dlg && dlg.querySelector("#codigo");

  function mensaje() {
    const codigo = (campo.value || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20);
    const precio = fmt[moneda](actual[moneda]);
    const lineas = [`Hola, quiero comprar ${actual.nombre} (${precio}${moneda === "usd" ? ", pago desde fuera de Colombia" : ""}).`];
    if (enPC) lineas.push(`Mi código de equipo es: ${codigo || "(lo envío en un momento)"}`);
    else lineas.push("Te escribo desde el celular; el código de equipo te lo envío desde el PC.");
    lineas.push("¿Me envías los datos para pagar?");
    const href = `https://wa.me/${window.CH.wa}?text=${encodeURIComponent(lineas.join("\n"))}`;
    dlg.querySelectorAll("[data-wa]").forEach((w) => (w.href = href));
  }

  function llenarDialogo() {
    dlg.querySelectorAll('[data-c="nombre"]').forEach((x) => (x.textContent = actual.nombre));
    dlg.querySelector('[data-c="antes"]').textContent = fmt[moneda](actual[moneda + "0"]);
    ["precio", "precio2", "precio3"].forEach((k) =>
      dlg.querySelectorAll(`[data-c="${k}"]`).forEach((x) => (x.textContent = fmt[moneda](actual[moneda]))));
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
    dlg.querySelector("[data-enviar-link]").addEventListener("click", (ev) =>
      enviarLink(actual.nombre, window.CH.descarga + actual.archivo, ev.currentTarget));
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
