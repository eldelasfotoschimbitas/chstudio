// Página de gracias: confirma el pago con el servidor y muestra el código de compra.
(() => {
  const ua = navigator.userAgent || "";
  const enPC = /Windows NT/i.test(ua) && !/Mobile|Phone|Android/i.test(ua);
  document.documentElement.classList.add(enPC ? "es-pc" : "es-movil");

  const INSTALADOR = {
    "fotocull": "CH-Select-Setup.exe", "exportar-redes": "CH-Social-Setup.exe", "raw-pdf": "CH-Proof-Setup.exe",
    "fotopicker": "CH-Finder-Setup.exe", "comprimir-pdfs": "CH-Compress-Setup.exe", "suite": "CH-Studio-Suite-Setup.exe",
  };
  const q = new URLSearchParams(location.search);
  let orden = q.get("o") || "";
  let k = q.get("k") || "";
  try {  // si recarga la página, recupera la orden de esta pestaña
    if (orden && k) sessionStorage.setItem("chs-orden", JSON.stringify([orden, k]));
    else [orden, k] = JSON.parse(sessionStorage.getItem("chs-orden") || '["",""]');
  } catch (_) {}
  const ver = (id) => ["g-espera", "g-pendiente", "g-ok", "g-error"].forEach((x) => (document.getElementById(x).hidden = x !== id));
  const poner = (sel, txt) => document.querySelectorAll(`[data-g="${sel}"]`).forEach((x) => (x.textContent = txt));

  if (!/^ORD-[0-9A-F]{18}$/.test(orden) || !k) { ver("g-error"); return; }
  // que el secreto no quede en el historial ni se comparta por accidente
  history.replaceState(null, "", location.pathname);

  let intentos = 0;
  async function consultar() {
    intentos++;
    try {
      const r = await fetch(`${window.CH.api}/api/estado?o=${encodeURIComponent(orden)}&k=${encodeURIComponent(k)}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      poner("correo", d.email || "tu correo");
      if (d.estado === "pagada" && d.codigo) return mostrar(d);
      if (intentos > 3) ver("g-pendiente");
    } catch (_) {
      if (intentos > 5) { ver("g-error"); return; }
    }
    setTimeout(consultar, intentos < 10 ? 3000 : 10000);
  }

  function mostrar(d) {
    poner("nombre", d.nombre);
    document.getElementById("g-codigo").textContent = d.codigo;
    const url = window.CH.descarga + (INSTALADOR[d.producto] || "");
    document.getElementById("g-descarga").href = url;
    const txt = `Mi código de compra de ${d.nombre} (CH Studio): ${d.codigo}\nInstalador para el PC: ${url}`;
    document.getElementById("g-wa").href = `https://wa.me/?text=${encodeURIComponent(txt)}`;
    document.getElementById("g-copiar").onclick = async (ev) => {
      try { await navigator.clipboard.writeText(d.codigo); ev.target.textContent = "Copiado"; } catch (_) { ev.target.textContent = "Selecciónalo y copia"; }
    };
    document.getElementById("g-enviar").onclick = async (ev) => {
      try {
        if (navigator.share) { await navigator.share({ title: d.nombre, text: txt }); return; }
        await navigator.clipboard.writeText(txt); ev.target.textContent = "Copiado";
      } catch (_) {}
    };
    ver("g-ok");
  }
  consultar();
})();
