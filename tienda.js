// Moneda (COP/USD), compra (tarjeta automática o WhatsApp), enviar link al PC y botón para subir.
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
  let pagos = { mp: false, paypal: false };

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
      if (navigator.share) { await navigator.share({ title: `${nombre} | CH Studio`, text: texto }); return; }
    } catch (e) { if (e && e.name === "AbortError") return; }
    try {
      await navigator.clipboard.writeText(url);
      if (boton) { const antes = boton.textContent; boton.textContent = "Link copiado"; setTimeout(() => (boton.textContent = antes), 2000); }
    } catch (_) {
      window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
    }
  }
  window.CH.enviarLink = enviarLink;

  document.querySelectorAll("[data-descarga]").forEach((a) => {
    if (enPC) return;
    a.textContent = "Enviar link a mi PC";
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      const nombre = document.querySelector("h1")?.textContent?.trim() || "CH Studio";
      enviarLink(a.dataset.descarga.includes("Suite") ? "CH Studio Suite" : nombre, a.href, a);
    });
  });

  // ---- compra ----
  const dlg = document.getElementById("compra");
  const correo = dlg && dlg.querySelector("#correo");
  const errorPago = dlg && dlg.querySelector(".error-pago");

  function mensajeWA() {
    const precio = fmt[moneda](actual[moneda]);
    const txt = `Hola, quiero comprar ${actual.nombre} (${precio}${moneda === "usd" ? ", pago desde fuera de Colombia" : ""}).\n` +
      "¿Me envías los datos para pagar?";
    const href = `https://wa.me/${window.CH.wa}?text=${encodeURIComponent(txt)}`;
    dlg.querySelectorAll("[data-wa]").forEach((w) => (w.href = href));
  }

  function llenarDialogo() {
    const c = (k) => dlg.querySelectorAll(`[data-c="${k}"]`);
    c("nombre").forEach((x) => (x.textContent = actual.nombre));
    c("antes").forEach((x) => (x.textContent = fmt[moneda](actual[moneda + "0"])));
    ["precio", "precio2"].forEach((k) => c(k).forEach((x) => (x.textContent = fmt[moneda](actual[moneda]))));
    c("cop").forEach((x) => (x.textContent = fmt.cop(actual.cop)));
    c("usd").forEach((x) => (x.textContent = fmt.usd(actual.usd)));
    ["mb", "mb2"].forEach((k) => c(k).forEach((x) => (x.textContent = actual.mb)));
    ["descarga", "descarga2"].forEach((k) => c(k).forEach((x) => (x.href = window.CH.descarga + actual.archivo)));
    const hayAuto = pagos.mp || pagos.paypal;
    dlg.querySelector(".auto").hidden = !hayAuto;
    dlg.querySelector(".manual").hidden = hayAuto;
    dlg.querySelector('[data-metodo="mp"]').hidden = !pagos.mp;
    dlg.querySelector('[data-metodo="paypal"]').hidden = !pagos.paypal;
    // el medio de la moneda elegida va primero
    const metodos = dlg.querySelector(".metodos");
    const primero = metodos.querySelector(`[data-metodo="${moneda === "usd" ? "paypal" : "mp"}"]`);
    metodos.prepend(primero);
    mensajeWA();
  }

  async function pagar(metodo, boton) {
    errorPago.hidden = true;
    const email = (correo.value || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email)) {
      errorPago.textContent = "Escribe tu correo: ahí te llega el código de compra.";
      errorPago.hidden = false;
      correo.focus();
      return;
    }
    try { localStorage.setItem("chs-correo", email); } catch (_) {}
    const antes = boton.innerHTML;
    boton.disabled = true;
    boton.textContent = "Abriendo el pago seguro…";
    try {
      const r = await fetch(window.CH.api + "/api/crear-pago", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ producto: actual.id, metodo, email }),
      });
      const d = await r.json();
      if (!r.ok || !d.url) throw new Error(d.error || "No se pudo abrir el pago.");
      const u = new URL(d.url);
      const permitidos = ["mercadopago.com", "mercadopago.com.co", "mercadolibre.com", "paypal.com", "mpago.la"];
      if (u.protocol !== "https:" || !permitidos.some((h) => u.hostname === h || u.hostname.endsWith("." + h))) {
        throw new Error("Link de pago no reconocido.");
      }
      window.location.href = u.href;
    } catch (e) {
      errorPago.textContent = (e && e.message) || "No se pudo abrir el pago. Intenta de nuevo o escríbenos por WhatsApp.";
      errorPago.hidden = false;
      boton.disabled = false;
      boton.innerHTML = antes;
    }
  }

  if (dlg) {
    try { correo.value = localStorage.getItem("chs-correo") || ""; } catch (_) {}
    document.querySelectorAll("[data-comprar]").forEach((b) => {
      b.addEventListener("click", () => {
        const d = b.dataset;
        actual = { id: d.id, nombre: d.nombre, cop: d.cop, usd: d.usd, cop0: d.cop0, usd0: d.usd0, archivo: d.archivo, mb: d.mb };
        llenarDialogo();
        dlg.showModal();
      });
    });
    dlg.querySelectorAll("[data-metodo]").forEach((b) => b.addEventListener("click", () => pagar(b.dataset.metodo, b)));
    dlg.querySelectorAll("[data-enviar-link]").forEach((b) =>
      b.addEventListener("click", (ev) => enviarLink(actual.nombre, window.CH.descarga + actual.archivo, ev.currentTarget)));
    dlg.addEventListener("click", (ev) => { if (ev.target === dlg) dlg.close(); });
    // ¿qué medios de pago están activos?
    const ctl = new AbortController();
    setTimeout(() => ctl.abort(), 6000);
    fetch(window.CH.api + "/api/pagos", { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => { pagos = { mp: d.mp === true, paypal: d.paypal === true }; if (actual) llenarDialogo(); })
      .catch(() => {});
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
