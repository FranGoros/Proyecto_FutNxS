let partidoActualId = null;


// ========================================
// JUGADORES
// ========================================

async function mostrarJugadores() {

    const lista =
        document.getElementById("lista-jugadores");


    // Si ya está mostrando jugadores, lo cerramos
    if (lista.style.display === "block") {

        lista.style.display = "none";

        return;
    }


    // Si está cerrado, lo mostramos
    lista.style.display = "block";


    const respuesta = await fetch(
        "http://127.0.0.1:8000/jugadores"
    );


    const jugadores =
        await respuesta.json();


    lista.innerHTML = "";


    for (const jugador of jugadores) {

        lista.innerHTML += `
            <p>
                ${jugador.id}. ${jugador.nombre}
            </p>
        `;
    }
}


function mostrarFormularioJugador() {

    document.getElementById(
        "formulario-jugador"
    ).style.display = "block";
}


function ocultarFormularioJugador() {

    document.getElementById(
        "formulario-jugador"
    ).style.display = "none";
}


async function agregarJugador() {

    const input =
        document.getElementById("nombre-jugador");

    const nombre =
        input.value.trim();


    if (nombre === "") {

        alert("Ingresá un nombre.");

        return;
    }


    const respuesta = await fetch(
        "http://127.0.0.1:8000/jugadores",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                nombre: nombre
            })
        }
    );


    const resultado =
        await respuesta.json();


    if (!respuesta.ok) {

        console.error(resultado);

        alert(
            "No se pudo agregar el jugador."
        );

        return;
    }


    input.value = "";

    ocultarFormularioJugador();

    mostrarJugadores();
}


// ========================================
// CREAR PARTIDO
// ========================================

function mostrarFormularioPartido() {

    document.getElementById(
        "formulario-partido"
    ).style.display = "block";
}


function ocultarFormularioPartido() {

    document.getElementById(
        "formulario-partido"
    ).style.display = "none";
}


async function crearPartido() {

    const fecha =
        document.getElementById(
            "fecha-partido"
        ).value;


    const golesA =
        document.getElementById(
            "goles-a"
        ).value;


    const golesB =
        document.getElementById(
            "goles-b"
        ).value;


    if (fecha === "") {

        alert(
            "Seleccioná una fecha."
        );

        return;
    }


    if (
        Number(golesA) < 0 ||
        Number(golesB) < 0
    ) {

        alert(
            "Los goles no pueden ser negativos."
        );

        return;
    }


    const respuesta = await fetch(
        "http://127.0.0.1:8000/partidos",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                fecha: fecha,

                goles_a: Number(golesA),

                goles_b: Number(golesB)

            })
        }
    );


    const resultado =
        await respuesta.json();


    if (!respuesta.ok) {

        console.error(resultado);

        alert(
            "Error " +
            respuesta.status +
            ": " +
            JSON.stringify(resultado)
        );

        return;
    }


    partidoActualId =
        resultado.id;


    ocultarFormularioPartido();


    document.getElementById(
        "asignacion-jugadores"
    ).style.display = "block";


    await cargarJugadoresParaPartido();

    await cargarJugadoresDelPartido();

    await cargarJugadoresParaGol();

    await cargarGoles();


    alert(
        "Partido creado. Ahora agregá los jugadores."
    );
}


// ========================================
// JUGADORES DEL PARTIDO
// ========================================

async function cargarJugadoresParaPartido() {

    const respuesta = await fetch(
        "http://127.0.0.1:8000/jugadores"
    );


    const jugadores =
        await respuesta.json();


    const selectA =
        document.getElementById(
            "jugador-equipo-a"
        );


    const selectB =
        document.getElementById(
            "jugador-equipo-b"
        );


    selectA.innerHTML =
        '<option value="">Seleccionar jugador</option>';

    selectB.innerHTML =
        '<option value="">Seleccionar jugador</option>';


    for (const jugador of jugadores) {

        const opcionA =
            document.createElement("option");

        opcionA.value =
            jugador.id;

        opcionA.textContent =
            jugador.nombre;


        selectA.appendChild(opcionA);


        const opcionB =
            document.createElement("option");

        opcionB.value =
            jugador.id;

        opcionB.textContent =
            jugador.nombre;


        selectB.appendChild(opcionB);
    }
}


async function agregarJugadorAlPartido(lado) {

    if (partidoActualId === null) {

        alert(
            "Primero tenés que crear un partido."
        );

        return;
    }


    let select;


    if (lado === "A") {

        select =
            document.getElementById(
                "jugador-equipo-a"
            );

    } else {

        select =
            document.getElementById(
                "jugador-equipo-b"
            );
    }


    const jugadorId =
        select.value;


    if (jugadorId === "") {

        alert(
            "Seleccioná un jugador."
        );

        return;
    }


    const parametros =
        new URLSearchParams({

            jugador_id: jugadorId,

            lado: lado

        });


    const respuesta = await fetch(

        `http://127.0.0.1:8000/partidos/${partidoActualId}/jugadores?${parametros}`,

        {
            method: "POST"
        }
    );


    const resultado =
        await respuesta.json();


    if (!respuesta.ok) {

        alert(
            "No se pudo agregar el jugador: " +
            resultado.detail
        );

        return;
    }


    select.value = "";


    await cargarJugadoresDelPartido();

    await cargarJugadoresParaGol();
}


// ========================================
// MOSTRAR JUGADORES DEL PARTIDO
// ========================================

async function cargarJugadoresDelPartido() {

    if (partidoActualId === null) {
        return;
    }


    const respuesta = await fetch(

        `http://127.0.0.1:8000/partidos/${partidoActualId}/jugadores`

    );


    const jugadores =
        await respuesta.json();


    const listaA =
        document.getElementById(
            "lista-equipo-a"
        );


    const listaB =
        document.getElementById(
            "lista-equipo-b"
        );


    listaA.innerHTML = "";

    listaB.innerHTML = "";


    for (const jugador of jugadores) {

        if (jugador.lado === "A") {

            listaA.innerHTML += `
                <p>🔵 ${jugador.nombre}</p>
            `;

        } else {

            listaB.innerHTML += `
                <p>🔴 ${jugador.nombre}</p>
            `;
        }
    }
}


// ========================================
// JUGADORES DISPONIBLES PARA GOLES
// ========================================

async function cargarJugadoresParaGol() {

    if (partidoActualId === null) {
        return;
    }


    const lado =
        document.getElementById(
            "lado-gol"
        ).value;


    const respuesta = await fetch(

        `http://127.0.0.1:8000/partidos/${partidoActualId}/jugadores`

    );


    const jugadores =
        await respuesta.json();


    const select =
        document.getElementById(
            "jugador-gol"
        );


    select.innerHTML =
        '<option value="">Seleccionar jugador</option>';


    for (const jugador of jugadores) {

        if (jugador.lado === lado) {

            const opcion =
                document.createElement("option");

            opcion.value =
                jugador.jugador_id;

            opcion.textContent =
                jugador.nombre;

            select.appendChild(opcion);
        }
    }
}


// ========================================
// AGREGAR GOL
// ========================================

async function agregarGol() {

    if (partidoActualId === null) {

        alert(
            "Primero tenés que crear un partido."
        );

        return;
    }


    const lado =
        document.getElementById(
            "lado-gol"
        ).value;


    const jugadorId =
        document.getElementById(
            "jugador-gol"
        ).value;


    const minuto =
        document.getElementById(
            "minuto-gol"
        ).value;


    if (jugadorId === "") {

        alert(
            "Seleccioná quién hizo el gol."
        );

        return;
    }


    if (minuto === "") {

        alert(
            "Ingresá el minuto del gol."
        );

        return;
    }


    if (Number(minuto) < 0) {

        alert(
            "El minuto no puede ser negativo."
        );

        return;
    }


    const parametros =
        new URLSearchParams({

            jugador_id: jugadorId,

            minuto: minuto,

            lado: lado

        });


    const respuesta = await fetch(

        `http://127.0.0.1:8000/partidos/${partidoActualId}/goles?${parametros}`,

        {
            method: "POST"
        }
    );


    const resultado =
        await respuesta.json();


    if (!respuesta.ok) {

        console.error(
            "Error completo:",
            resultado
        );

        alert(
            "No se pudo registrar el gol: " +
            JSON.stringify(resultado)
        );

        return;
    }


    document.getElementById(
        "jugador-gol"
    ).value = "";


    document.getElementById(
        "minuto-gol"
    ).value = "";


    await cargarGoles();
}


// ========================================
// MOSTRAR GOLES
// ========================================

async function cargarGoles() {

    if (partidoActualId === null) {
        return;
    }


    const respuesta = await fetch(

        `http://127.0.0.1:8000/partidos/${partidoActualId}/goles`

    );


    const goles =
        await respuesta.json();


    const lista =
        document.getElementById(
            "lista-goles"
        );


    lista.innerHTML =
        "<h4>Goles registrados:</h4>";


    if (goles.length === 0) {

        lista.innerHTML +=
            "<p>Todavía no hay goles registrados.</p>";

        return;
    }


    for (const gol of goles) {

        const color =
            gol.lado === "A"
                ? "🔵"
                : "🔴";


        lista.innerHTML += `
            <p>
                ${color}
                ${gol.nombre}
                - minuto ${gol.minuto}
            </p>
        `;
    }
}


// ========================================
// ESTADISTICAS
// ========================================

async function mostrarEstadisticas() {

    const contenedor =
        document.getElementById(
            "estadisticas"
        );


    if (
        contenedor.style.display === "block"
    ) {

        contenedor.style.display = "none";

        return;
    }


    contenedor.style.display = "block";


    await cargarRankingGoleadores();

    await cargarEstadisticasJugadores();
}


// ========================================
// RANKING DE GOLEADORES
// ========================================

async function cargarRankingGoleadores() {

    const respuesta = await fetch(

        "http://127.0.0.1:8000/estadisticas/goleadores"

    );


    const goleadores =
        await respuesta.json();


    const lista =
        document.getElementById(
            "ranking-goleadores"
        );


    lista.innerHTML = "";


    if (goleadores.length === 0) {

        lista.innerHTML =
            "<p>Todavía no hay goles registrados.</p>";

        return;
    }


    let posicion = 1;


    for (const jugador of goleadores) {

        lista.innerHTML += `
            <p>
                <strong>
                    ${posicion}. ${jugador.nombre}
                </strong>
                - ${jugador.goles} goles
            </p>
        `;

        posicion++;
    }
}


// ========================================
// ESTADISTICAS DE JUGADORES
// ========================================

async function cargarEstadisticasJugadores() {

    const respuesta =
        await fetch(
            "http://127.0.0.1:8000/jugadores"
        );


    const jugadores =
        await respuesta.json();


    const lista =
        document.getElementById(
            "estadisticas-jugadores"
        );


    lista.innerHTML = "";


    if (jugadores.length === 0) {

        lista.innerHTML =
            "<p>No hay jugadores registrados.</p>";

        return;
    }


    for (const jugador of jugadores) {

        const respuestaEstadisticas =
            await fetch(

                `http://127.0.0.1:8000/jugadores/${jugador.id}/estadisticas`

            );


        const estadisticas =
            await respuestaEstadisticas.json();


        lista.innerHTML += `
            <div>

                <h4>
                    ${estadisticas.jugador}
                </h4>

                <p>
                    Partidos jugados:
                    ${estadisticas.partidos_jugados}
                </p>

                <p>
                    Goles:
                    ${estadisticas.goles}
                </p>

                <p>
                    Goles por partido:
                    ${estadisticas.goles_por_partido}
                </p>

            </div>

            <hr>
        `;
    }
}


// ========================================
// HISTORIAL
// ========================================

async function mostrarHistorial() {

    const contenedor =
        document.getElementById(
            "historial"
        );


    if (
        contenedor.style.display === "block"
    ) {

        contenedor.style.display = "none";

        return;
    }


    contenedor.style.display = "block";


    await cargarHistorial();
}


// ========================================
// CARGAR HISTORIAL
// ========================================

async function cargarHistorial() {

    const respuesta =
        await fetch(
            "http://127.0.0.1:8000/partidos"
        );


    const partidos =
        await respuesta.json();


    const lista =
        document.getElementById(
            "lista-historial"
        );


    lista.innerHTML = "";


    if (partidos.length === 0) {

        lista.innerHTML =
            "<p>Todavía no hay partidos registrados.</p>";

        return;
    }


    for (const partido of partidos) {

        lista.innerHTML += `

            <div>

                <h3>
                    📅 ${partido.fecha}
                </h3>

                <h2>
                    🔵 ${partido.goles_a}
                    -
                    ${partido.goles_b} 🔴
                </h2>

                <button
                    onclick="verDetallePartido(${partido.id})"
                >
                    Ver partido
                </button>

                <div
                    id="detalle-partido-${partido.id}"
                    style="display: none; margin-top: 15px;"
                >
                </div>

            </div>

            <hr>
        `;
    }
}


// ========================================
// DETALLE DE PARTIDO
// ========================================

async function verDetallePartido(partidoId) {

    const contenedor =
        document.getElementById(
            `detalle-partido-${partidoId}`
        );


    if (
        contenedor.style.display === "block"
    ) {

        contenedor.style.display = "none";

        return;
    }


    const respuesta =
        await fetch(

            `http://127.0.0.1:8000/partidos/${partidoId}`

        );


    const partido =
        await respuesta.json();


    if (!respuesta.ok) {

        alert(
            "No se pudo cargar el partido."
        );

        return;
    }


    let html = "";


    // EQUIPO A

    html += `
        <h4>🔵 Equipo A</h4>
    `;


    if (partido.jugadores.A.length === 0) {

        html += `
            <p>
                No hay jugadores registrados.
            </p>
        `;

    } else {

        for (const jugador of partido.jugadores.A) {

            html += `
                <p>
                    ${jugador.nombre}
                </p>
            `;
        }
    }


    // EQUIPO B

    html += `
        <h4>🔴 Equipo B</h4>
    `;


    if (partido.jugadores.B.length === 0) {

        html += `
            <p>
                No hay jugadores registrados.
            </p>
        `;

    } else {

        for (const jugador of partido.jugadores.B) {

            html += `
                <p>
                    ${jugador.nombre}
                </p>
            `;
        }
    }


    // GOLES

    html += `
        <h4>⚽ Goles registrados</h4>
    `;


    if (partido.goles.length === 0) {

        html += `
            <p>
                No hay goles individuales registrados.
            </p>
        `;

    } else {

        for (const gol of partido.goles) {

            const color =
                gol.lado === "A"
                    ? "🔵"
                    : "🔴";


            html += `
                <p>
                    ${color}
                    ${gol.nombre}
                    - minuto ${gol.minuto}
                </p>
            `;
        }
    }


    contenedor.innerHTML = html;

    contenedor.style.display = "block";
}


// ========================================
// FINALIZAR PARTIDO
// ========================================

function finalizarPartido() {

    document.getElementById(
        "asignacion-jugadores"
    ).style.display = "none";


    document.getElementById(
        "fecha-partido"
    ).value = "";


    document.getElementById(
        "goles-a"
    ).value = 0;


    document.getElementById(
        "goles-b"
    ).value = 0;


    document.getElementById(
        "lista-equipo-a"
    ).innerHTML = "";


    document.getElementById(
        "lista-equipo-b"
    ).innerHTML = "";


    document.getElementById(
        "lista-goles"
    ).innerHTML = "";


    partidoActualId = null;


    alert(
        "Partido guardado correctamente."
    );
}

// ========================================
// ANIMACION DE PANELES
// ========================================

document.querySelectorAll(".card").forEach(function(card) {

    card.addEventListener("click", function() {

        // Sacamos la selección de los demás paneles
        document.querySelectorAll(".card").forEach(function(otroCard) {
            otroCard.classList.remove("seleccionado");
        });

        // Seleccionamos este panel
        card.classList.add("seleccionado");
    });

});