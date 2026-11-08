
let todasLasCamisetas = [];

let criterioOrden = "fecha";
let direccionOrden = -1;
let vistaActual = "cuadricula";

document.addEventListener("DOMContentLoaded", cargarListado);

function normalizar(texto) {
    return String(texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

async function cargarListado() {
    const galeria = document.getElementById("galeriaCamisetas");
    const mensaje = document.getElementById("mensajeListado");

    try {
        mensaje.textContent = "Cargando colección...";

        const respuesta = await fetch("data/camisetas.json", {
            cache: "no-store"
        });

        if (!respuesta.ok) {
            throw new Error("No se ha podido cargar la colección.");
        }

        todasLasCamisetas = await respuesta.json();

        if (!Array.isArray(todasLasCamisetas)) {
            throw new Error("El archivo de colección no es válido.");
        }

        // Guardar la posición original para mantener el orden
        // cuando no exista fecha de incorporación.
        todasLasCamisetas.forEach((camiseta, indice) => {
            camiseta._ordenOriginal = indice;
        });

        prepararFiltros();
        configurarFiltros();
        aplicarFiltros();

        mensaje.textContent = "";

    } catch (error) {
        console.error("Error cargando listado:", error);

        mensaje.textContent =
            error.message || "No se ha podido cargar la colección.";

        galeria.replaceChildren();

        document.getElementById("contadorCamisetas").textContent =
            "No se ha podido cargar la colección.";
    }
}

// =====================================================
// FILTROS
// =====================================================

function prepararFiltros() {
    rellenarFiltro("filtroDeporte", "Todos los deportes", "deporte");
    rellenarFiltro("filtroCaracter", "Club y selección", "caracter");
    rellenarFiltro("filtroPais", "Todos los países", "pais");
    rellenarFiltro("filtroModelo", "Todos los modelos", "modelo");
}

function rellenarFiltro(id, textoInicial, propiedad) {
    const select = document.getElementById(id);

    select.replaceChildren();

    const inicial = document.createElement("option");
    inicial.value = "";
    inicial.textContent = textoInicial;

    select.appendChild(inicial);

    const valores = [...new Set(
        todasLasCamisetas
            .map(c => String(c[propiedad] || "").trim())
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, "es"));

    valores.forEach(valor => {
        const opcion = document.createElement("option");

        opcion.value = valor;
        opcion.textContent = valor;

        select.appendChild(opcion);
    });
}

function configurarFiltros() {

    ["busqueda", "filtroDeporte", "filtroCaracter", "filtroPais", "filtroModelo"]
        .forEach(id => {

            const evento = id === "busqueda" ? "input" : "change";

            document.getElementById(id)
                .addEventListener(evento, aplicarFiltros);
        });

    // Ordenación
    document.getElementById("ordenarPor")
        .addEventListener("change", event => {
            criterioOrden = event.target.value;
            aplicarFiltros();
        });

    // Dirección de ordenación
    document.getElementById("cambiarDireccion")
        .addEventListener("click", cambiarDireccionOrden);

    // Modo de visualización
    document.getElementById("vistaCuadricula")
        .addEventListener("click", () => cambiarVista("cuadricula"));

    document.getElementById("vistaListado")
        .addEventListener("click", () => cambiarVista("listado"));

    // Limpiar
    document.getElementById("limpiarFiltros")
        .addEventListener("click", limpiarFiltros);
}

// =====================================================
// APLICAR FILTROS Y ORDENACIÓN
// =====================================================

function aplicarFiltros() {

    const busqueda = normalizar(
        document.getElementById("busqueda").value
    );

    const deporte = document.getElementById("filtroDeporte").value;
    const caracter = document.getElementById("filtroCaracter").value;
    const pais = document.getElementById("filtroPais").value;
    const modelo = document.getElementById("filtroModelo").value;

    const filtradas = todasLasCamisetas.filter(camiseta => {

        const texto = normalizar([
            camiseta.nombre,
            camiseta.pais,
            camiseta.deporte,
            camiseta.caracter,
            camiseta.marca,
            camiseta.modelo,
            camiseta.jugador,
            camiseta.dorsal,
            camiseta.anio,
            camiseta.descripcion
        ].join(" "));

        return (!busqueda || texto.includes(busqueda)) &&
            (!deporte || camiseta.deporte === deporte) &&
            (!caracter || camiseta.caracter === caracter) &&
            (!pais || camiseta.pais === pais) &&
            (!modelo || camiseta.modelo === modelo);
    });

    ordenarCamisetas(filtradas);

    mostrarCamisetas(filtradas);
}

function ordenarCamisetas(camisetas) {

    camisetas.sort((a, b) => {

        let resultado = 0;

        switch (criterioOrden) {

            case "fecha": {
                const fechaA = a.fechaAlta
                    ? new Date(a.fechaAlta).getTime()
                    : null;

                const fechaB = b.fechaAlta
                    ? new Date(b.fechaAlta).getTime()
                    : null;

                if (fechaA !== null && !Number.isNaN(fechaA) &&
                    fechaB !== null && !Number.isNaN(fechaB)) {

                    resultado = fechaA - fechaB;

                } else if (fechaA !== null && !Number.isNaN(fechaA)) {
                    resultado = 1;

                } else if (fechaB !== null && !Number.isNaN(fechaB)) {
                    resultado = -1;
                }

                break;
            }

            case "anio":
                resultado =
                    Number(a.anio || 0) - Number(b.anio || 0);
                break;

            case "nombre":
                resultado = String(a.nombre || "")
                    .localeCompare(String(b.nombre || ""), "es");
                break;

            case "pais":
                resultado = String(a.pais || "")
                    .localeCompare(String(b.pais || ""), "es");
                break;

            case "marca":
                resultado = String(a.marca || "")
                    .localeCompare(String(b.marca || ""), "es");
                break;
        }

        // Aplicar dirección y conservar orden original en empates.
        return (resultado * direccionOrden) ||
            (a._ordenOriginal - b._ordenOriginal);
    });
}

function cambiarDireccionOrden() {

    direccionOrden *= -1;

    const boton = document.getElementById("cambiarDireccion");

    boton.textContent = direccionOrden === -1
        ? "Descendente ↓"
        : "Ascendente ↑";

    aplicarFiltros();
}

// =====================================================
// CAMBIAR VISTA
// =====================================================

function cambiarVista(vista) {

    vistaActual = vista;

    const botonCuadricula = document.getElementById("vistaCuadricula");
    const botonListado = document.getElementById("vistaListado");

    botonCuadricula.classList.toggle(
        "vista-activa",
        vista === "cuadricula"
    );

    botonListado.classList.toggle(
        "vista-activa",
        vista === "listado"
    );

    botonCuadricula.setAttribute(
        "aria-pressed",
        String(vista === "cuadricula")
    );

    botonListado.setAttribute(
        "aria-pressed",
        String(vista === "listado")
    );

    document.getElementById("galeriaCamisetas")
        .classList.toggle("vista-listado", vista === "listado");
}

// =====================================================
// MOSTRAR CAMISETAS
// =====================================================

function mostrarCamisetas(camisetas) {

    const galeria = document.getElementById("galeriaCamisetas");
    const contador = document.getElementById("contadorCamisetas");

    galeria.replaceChildren();

    galeria.classList.toggle(
        "vista-listado",
        vistaActual === "listado"
    );

    contador.textContent =
        `${camisetas.length} ${camisetas.length === 1 ? "camiseta" : "camisetas"}`;

    if (!camisetas.length) {

        const mensaje = document.createElement("div");

        mensaje.className = "sin-resultados";

        mensaje.textContent = todasLasCamisetas.length === 0
            ? "Todavía no hay camisetas publicadas."
            : "No se han encontrado camisetas con esos criterios.";

        galeria.appendChild(mensaje);

        return;
    }

    camisetas.forEach(camiseta => {

        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta-camiseta";

        // Enlace a la ficha
        const enlace = document.createElement("a");

        enlace.className = "enlace-tarjeta";
        enlace.href = `detalle.html?id=${encodeURIComponent(camiseta.id)}`;

        enlace.setAttribute(
            "aria-label",
            `Ver ficha de ${camiseta.nombre || "camiseta"}`
        );

        // Fotografía principal
        if (camiseta.fotoFrontal) {

            const imagen = document.createElement("img");

            imagen.className = "imagen-camiseta";
            imagen.src = `fotos/${encodeURIComponent(camiseta.fotoFrontal)}`;
            imagen.alt = `Camiseta ${camiseta.nombre || ""}`;
            imagen.loading = "lazy";

            imagen.onerror = () => {

                const vacia = document.createElement("div");

                vacia.className = "imagen-no-disponible";
                vacia.textContent = "Fotografía no disponible";

                imagen.replaceWith(vacia);
            };

            enlace.appendChild(imagen);

        } else {

            const vacia = document.createElement("div");

            vacia.className = "imagen-no-disponible";
            vacia.textContent = "Fotografía no disponible";

            enlace.appendChild(vacia);
        }

        // Datos
        const datos = document.createElement("div");
        datos.className = "datos-camiseta";

        const titulo = document.createElement("h3");
        titulo.textContent = camiseta.nombre || "Sin nombre";

        datos.appendChild(titulo);

        agregarDato(datos, "Año", camiseta.anio);
        agregarDato(datos, "País", camiseta.pais);
        agregarDato(datos, "Deporte", camiseta.deporte);
        agregarDato(datos, "Modelo", camiseta.modelo);
        agregarDato(datos, "Marca", camiseta.marca);
        agregarDato(datos, "Jugador", camiseta.jugador);
        agregarDato(datos, "Dorsal", camiseta.dorsal);

        enlace.appendChild(datos);
        tarjeta.appendChild(enlace);

        // Único botón de acción: Ver ficha
        const boton = document.createElement("a");

        boton.className = "boton-secundario boton-ver-ficha";
        boton.href = enlace.href;
        boton.textContent = "Ver ficha";

        tarjeta.appendChild(boton);

        galeria.appendChild(tarjeta);
    });
}

// =====================================================
// DATOS DE CADA CAMISETA
// =====================================================

function agregarDato(contenedor, etiqueta, valor) {

    if (
        valor === undefined ||
        valor === null ||
        String(valor).trim() === ""
    ) {
        return;
    }

    const parrafo = document.createElement("p");

    const negrita = document.createElement("strong");
    negrita.textContent = `${etiqueta}: `;

    parrafo.append(
        negrita,
        document.createTextNode(String(valor))
    );

    contenedor.appendChild(parrafo);
}

// =====================================================
// LIMPIAR FILTROS Y RESTABLECER ORDEN
// =====================================================

function limpiarFiltros() {

    document.getElementById("busqueda").value = "";
    document.getElementById("filtroDeporte").value = "";
    document.getElementById("filtroCaracter").value = "";
    document.getElementById("filtroPais").value = "";
    document.getElementById("filtroModelo").value = "";

    criterioOrden = "fecha";
    direccionOrden = -1;

    document.getElementById("ordenarPor").value = "fecha";

    document.getElementById("cambiarDireccion").textContent =
        "Descendente ↓";

    aplicarFiltros();
}
