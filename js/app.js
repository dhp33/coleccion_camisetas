document.addEventListener("DOMContentLoaded", cargarEstadisticas);


async function cargarEstadisticas() {

    const totalElemento = document.getElementById("totalCamisetas");
    const contenedor = document.getElementById("estadisticasDeportes");
    const estado = document.getElementById("estadoCarga");

    try {

        const respuesta = await fetch("data/camisetas.json", {
            cache: "no-store"
        });

        if (!respuesta.ok) {
            throw new Error("No se ha podido cargar la colección.");
        }

        const camisetas = await respuesta.json();

        if (!Array.isArray(camisetas)) {
            throw new Error("El archivo de colección no es válido.");
        }

        totalElemento.textContent = camisetas.length;

        if (estado) {
            estado.textContent = "";
        }

        contenedor.innerHTML = "";

        if (camisetas.length === 0) {

            const mensaje = document.createElement("p");
            mensaje.className = "mensaje-estadisticas";
            mensaje.textContent = "Todavía no hay camisetas registradas.";

            contenedor.appendChild(mensaje);
            return;
        }

        // Agrupar por deporte y después por equipo.
        const deportes = {};

        camisetas.forEach(camiseta => {

            const deporte = String(
                camiseta.deporte || "Sin deporte indicado"
            ).trim();

            const equipo = String(
                camiseta.nombre || "Sin equipo indicado"
            ).trim();

            if (!deportes[deporte]) {
                deportes[deporte] = {};
            }

            deportes[deporte][equipo] =
                (deportes[deporte][equipo] || 0) + 1;

        });

        // Ordenar deportes por cantidad total.
        const distribucionDeportes = Object.entries(deportes)
            .map(([deporte, equipos]) => {

                const distribucionEquipos = Object.entries(equipos)
                    .sort((a, b) =>
                        b[1] - a[1] ||
                        a[0].localeCompare(b[0], "es")
                    );

                const totalDeporte = distribucionEquipos.reduce(
                    (total, equipo) => total + equipo[1],
                    0
                );

                return {
                    deporte,
                    equipos: distribucionEquipos,
                    total: totalDeporte
                };

            })
            .sort((a, b) =>
                b.total - a.total ||
                a.deporte.localeCompare(b.deporte, "es")
            );

        // Crear una tarjeta por deporte.
        distribucionDeportes.forEach(datosDeporte => {
            dibujarGraficoDeporte(datosDeporte, contenedor);
        });

    } catch (error) {

        console.error("Error cargando estadísticas:", error);

        if (estado) {
            estado.textContent = "No se ha podido cargar la colección";
        }

        totalElemento.textContent = "—";
        contenedor.innerHTML = "";

        const mensaje = document.createElement("p");
        mensaje.className = "mensaje-estadisticas";
        mensaje.textContent = error.message || "No hay datos disponibles.";

        contenedor.appendChild(mensaje);
    }
}


// Obtener el icono correspondiente a cada deporte.
function obtenerIconoDeporte(deporte) {

    const nombre = String(deporte || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

    const iconos = {
        "futbol": "⚽",
        "rugby": "🏉",
        "baloncesto": "🏀",
        "basket": "🏀",
        "balonmano": "🤾",
        "voleibol": "🏐",
        "tenis": "🎾",
        "golf": "⛳",
        "beisbol": "⚾",
        "hockey": "🏑",
        "ciclismo": "🚴",
        "formula 1": "🏎️",
        "automovilismo": "🏎️"
    };

    return iconos[nombre] || "🏅";
}


// Crear la tarjeta estadística de un deporte.
function dibujarGraficoDeporte(datos, contenedor) {

    const { deporte, equipos, total } = datos;

    const colores = [
        "#7651a8",
        "#d64b4b",
        "#3976bd",
        "#299b78",
        "#d69b32",
        "#bd5d9b",
        "#548d9c",
        "#8b9b43",
        "#d47739",
        "#7770bd",
        "#a85c52",
        "#548d57"
    ];

    const tarjeta = document.createElement("article");
    tarjeta.className = "deporte-card";

    // Cabecera.
    const cabecera = document.createElement("div");
    cabecera.className = "cabecera-deporte";

    const enlaceDeporte = document.createElement("a");
    enlaceDeporte.className = "enlace-deporte";
    enlaceDeporte.href =
        `listado.html?deporte=${encodeURIComponent(deporte)}`;
    enlaceDeporte.textContent = deporte;

    const resumen = document.createElement("span");
    resumen.className = "resumen-deporte";
    resumen.textContent =
        `${total} ${total === 1 ? "camiseta" : "camisetas"}`;

    cabecera.appendChild(enlaceDeporte);
    cabecera.appendChild(resumen);

    tarjeta.appendChild(cabecera);

    
    // Gráfico circular.
    const contenidoGrafico = document.createElement("div");
    contenidoGrafico.className = "contenido-deporte";

    const grafico = document.createElement("div");
    grafico.className = "grafico-donut";

    // Icono central: único elemento clicable del gráfico.
    const enlaceIcono = document.createElement("a");
    enlaceIcono.className = "enlace-icono-deporte";
    enlaceIcono.href =
        `listado.html?deporte=${encodeURIComponent(deporte)}`;

    enlaceIcono.setAttribute(
        "aria-label",
        `Ver todas las camisetas de ${deporte}`
    );

    const icono = document.createElement("span");
    icono.className = "icono-deporte";
    icono.textContent = obtenerIconoDeporte(deporte);

    enlaceIcono.appendChild(icono);
    grafico.appendChild(enlaceIcono);

    // Calcular los segmentos del gráfico.
    let acumulado = 0;
    const segmentos = [];

    equipos.forEach(([nombre, cantidad], indice) => {

        const porcentaje = (cantidad / total) * 100;

        const inicio = acumulado;
        acumulado += porcentaje;

        const color = colores[indice % colores.length];

        segmentos.push(
            `${color} ${inicio}% ${acumulado}%`
        );

    });

    grafico.style.background =
        `conic-gradient(${segmentos.join(", ")})`;

    contenidoGrafico.appendChild(grafico);
    tarjeta.appendChild(contenidoGrafico);


    // Listado completo de equipos.
    const listaEquipos = document.createElement("div");
    listaEquipos.className = "lista-equipos";

    equipos.forEach(([nombre, cantidad]) => {

        const fila = document.createElement("div");
        fila.className = "equipo-estadistica";

        const enlaceEquipo = document.createElement("a");
        enlaceEquipo.className = "enlace-equipo";

        enlaceEquipo.href =
            `listado.html?deporte=${encodeURIComponent(deporte)}` +
            `&equipo=${encodeURIComponent(nombre)}`;

        enlaceEquipo.textContent = nombre;

        const cantidadEquipo = document.createElement("span");
        cantidadEquipo.className = "cantidad-equipo";
        cantidadEquipo.textContent = cantidad;

        fila.appendChild(enlaceEquipo);
        fila.appendChild(cantidadEquipo);

        listaEquipos.appendChild(fila);

    });

    tarjeta.appendChild(listaEquipos);
    contenedor.appendChild(tarjeta);
}