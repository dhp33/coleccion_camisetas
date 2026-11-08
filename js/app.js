document.addEventListener("DOMContentLoaded", cargarEstadisticas);

async function cargarEstadisticas() {
    const totalElemento = document.getElementById("totalCamisetas");
    const grafico = document.getElementById("graficoEquipos");
    const leyenda = document.getElementById("leyendaEquipos");
    const estado = document.getElementById("estadoCarga");

    try {
        const respuesta = await fetch("data/camisetas.json", { cache: "no-store" });
        if (!respuesta.ok) throw new Error("No se ha podido cargar la colección.");

        const camisetas = await respuesta.json();
        if (!Array.isArray(camisetas)) throw new Error("El archivo de colección no es válido.");

        totalElemento.textContent = camisetas.length;

        const equipos = {};
        camisetas.forEach(camiseta => {
            const nombre = String(camiseta.nombre || "").trim() || "Sin equipo indicado";
            equipos[nombre] = (equipos[nombre] || 0) + 1;
        });

        const distribucion = Object.entries(equipos).sort((a, b) => b[1] - a[1]);
        dibujarGrafico(distribucion, camisetas.length);

        if (estado) estado.textContent = "";
    } catch (error) {
        console.error("Error cargando estadísticas:", error);
        totalElemento.textContent = "—";
        grafico.style.background = "#555";
        leyenda.textContent = "Estadísticas no disponibles.";
        if (estado) estado.textContent = error.message;
    }
}

function dibujarGrafico(distribucion, total) {
    const grafico = document.getElementById("graficoEquipos");
    const leyenda = document.getElementById("leyendaEquipos");

    if (!total || !distribucion.length) {
        grafico.style.background = "#555";
        leyenda.textContent = "Todavía no hay camisetas registradas.";
        return;
    }

    const colores = [
        "#7651a8", "#d64b4b", "#3976bd", "#299b78",
        "#d69b32", "#bd5d9b", "#548d9c", "#8b9b43",
        "#d47739", "#7770bd", "#a85c52", "#548d57"
    ];

    let acumulado = 0;
    const segmentos = [];
    leyenda.replaceChildren();

    distribucion.forEach(([nombre, cantidad], indice) => {
        const inicio = acumulado;
        acumulado += cantidad / total * 100;
        const color = colores[indice % colores.length];
        segmentos.push(`${color} ${inicio}% ${acumulado}%`);

        const elemento = document.createElement("div");
        elemento.className = "elemento-leyenda";

        const indicador = document.createElement("span");
        indicador.className = "color-leyenda";
        indicador.style.backgroundColor = color;

        const texto = document.createElement("span");
        texto.textContent = nombre;

        const numero = document.createElement("span");
        numero.className = "cantidad-leyenda";
        numero.textContent = cantidad;

        elemento.append(indicador, texto, numero);
        leyenda.appendChild(elemento);
    });

    grafico.style.background = `conic-gradient(${segmentos.join(", ")})`;
}
