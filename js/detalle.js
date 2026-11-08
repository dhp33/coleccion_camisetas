let camisetaActual = null;
let indiceSlider = 0;
let fotografias = [];

document.addEventListener("DOMContentLoaded", cargarDetalle);

async function cargarDetalle() {
    const mensaje = document.getElementById("mensajeDetalle");

    try {
        mensaje.textContent = "Cargando información...";

        const id = new URLSearchParams(window.location.search).get("id");
        if (!id) throw new Error("No se ha especificado ninguna camiseta.");

        const respuesta = await fetch("data/camisetas.json", { cache: "no-store" });
        if (!respuesta.ok) throw new Error("No se ha podido cargar la colección.");

        const camisetas = await respuesta.json();
        if (!Array.isArray(camisetas)) throw new Error("El archivo de colección no es válido.");

        camisetaActual = camisetas.find(c => String(c.id) === String(id));
        if (!camisetaActual) throw new Error("No se ha encontrado la camiseta solicitada.");

        document.getElementById("nombreCamiseta").textContent =
            camisetaActual.nombre || "Camiseta sin nombre";

        cargarFotografias();
        mostrarInformacion(camisetaActual);
        configurarVisor();
        mensaje.textContent = "";
    } catch (error) {
        console.error("Error cargando ficha:", error);
        mensaje.textContent = error.message || "No se ha podido cargar la ficha.";
        document.getElementById("nombreCamiseta").textContent = "Ficha no disponible";
    }
}

function cargarFotografias() {
    fotografias = [];

    [
        { nombre: camisetaActual.fotoFrontal, etiqueta: "Vista frontal" },
        { nombre: camisetaActual.fotoTrasera, etiqueta: "Vista trasera" }
    ].forEach(foto => {
        if (!foto.nombre) return;
        fotografias.push({
            url: `fotos/${encodeURIComponent(foto.nombre)}`,
            etiqueta: foto.etiqueta
        });
    });

    if (!fotografias.length) {
        mostrarSliderVacio();
        return;
    }

    construirSlider();
}

function construirSlider() {
    const pista = document.getElementById("sliderPista");
    const indicadores = document.getElementById("sliderIndicadores");
    pista.replaceChildren();
    indicadores.replaceChildren();

    fotografias.forEach((foto, indice) => {
        const diapositiva = document.createElement("div");
        diapositiva.className = "slider-foto";

        const imagen = document.createElement("img");
        imagen.src = foto.url;
        imagen.alt = foto.etiqueta;
        imagen.loading = "lazy";
        imagen.addEventListener("click", () => {
            document.getElementById("imagenAmpliada").src = imagen.src;
            document.getElementById("visorFoto").classList.add("visible");
        });
        imagen.addEventListener("error", () => {
            diapositiva.textContent = "Fotografía no disponible.";
        });

        diapositiva.appendChild(imagen);
        pista.appendChild(diapositiva);

        const punto = document.createElement("button");
        punto.type = "button";
        punto.className = "slider-punto";
        punto.setAttribute("aria-label", `Mostrar ${foto.etiqueta}`);
        punto.addEventListener("click", () => irADiapositiva(indice));
        indicadores.appendChild(punto);
    });

    const varias = fotografias.length > 1;
    document.getElementById("sliderAnterior").hidden = !varias;
    document.getElementById("sliderSiguiente").hidden = !varias;
    document.getElementById("sliderPie").hidden = !varias;

    document.getElementById("sliderAnterior").onclick = () =>
        irADiapositiva((indiceSlider - 1 + fotografias.length) % fotografias.length);
    document.getElementById("sliderSiguiente").onclick = () =>
        irADiapositiva((indiceSlider + 1) % fotografias.length);

    indiceSlider = 0;
    actualizarSlider();
}

function irADiapositiva(indice) {
    if (indice < 0 || indice >= fotografias.length) return;
    indiceSlider = indice;
    actualizarSlider();
}

function actualizarSlider() {
    document.getElementById("sliderPista").style.transform =
        `translateX(-${indiceSlider * 100}%)`;

    document.querySelectorAll(".slider-punto").forEach((punto, indice) => {
        punto.classList.toggle("activo", indice === indiceSlider);
    });

    if (fotografias.length > 1) {
        document.getElementById("sliderContador").textContent =
            `${indiceSlider + 1} / ${fotografias.length}`;
    }
}

function mostrarSliderVacio() {
    const slider = document.getElementById("slider");
    slider.replaceChildren();

    const mensaje = document.createElement("div");
    mensaje.className = "slider-vacio";
    mensaje.textContent = "No hay fotografías disponibles.";
    slider.appendChild(mensaje);
}

function mostrarInformacion(camiseta) {
    const contenedor = document.getElementById("datosDetalle");
    contenedor.replaceChildren();

    const campos = [
        ["Deporte", camiseta.deporte],
        ["Carácter", camiseta.caracter],
        ["País", camiseta.pais],
        ["Año", camiseta.anio],
        ["Marca", camiseta.marca],
        ["Modelo", camiseta.modelo],
        ["Jugador", camiseta.jugador],
        ["Dorsal", camiseta.dorsal]
    ];

    campos.forEach(([etiqueta, valor]) => {
        if (valor === undefined || valor === null || String(valor).trim() === "") return;

        const dato = document.createElement("div");
        dato.className = "dato-detalle";

        const titulo = document.createElement("strong");
        titulo.textContent = etiqueta;

        const contenido = document.createElement("span");
        contenido.textContent = String(valor);

        dato.append(titulo, contenido);
        contenedor.appendChild(dato);
    });

    const descripcion = document.getElementById("descripcionDetalle");
    descripcion.replaceChildren();

    if (camiseta.descripcion && camiseta.descripcion.trim()) {
        const titulo = document.createElement("h3");
        titulo.textContent = "Descripción";

        const texto = document.createElement("p");
        texto.textContent = camiseta.descripcion;

        descripcion.append(titulo, texto);
    }
}

function configurarVisor() {
    const visor = document.getElementById("visorFoto");
    const imagenAmpliada = document.getElementById("imagenAmpliada");

    document.getElementById("cerrarVisor").addEventListener("click", cerrarVisor);

    visor.addEventListener("click", event => {
        if (event.target === visor) cerrarVisor();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") cerrarVisor();
    });
}

function cerrarVisor() {
    document.getElementById("visorFoto").classList.remove("visible");
    document.getElementById("imagenAmpliada").src = "";
}
