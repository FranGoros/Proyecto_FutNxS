const API = "https://futnxs.onrender.com";
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
        `${API}/jugadores`
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
        `${API}/jugadores`,
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
        `${API}/partidos`,
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
        `${API}/jugadores`
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

        `${API}/partidos/${partidoActualId}/jugadores?${parametros}`,

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

        `${API}/partidos/${partidoActualId}/jugadores`

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

        `${API}/partidos/${partidoActualId}/jugadores`

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

        `${API}/partidos/${partidoActualId}/goles?${parametros}`,

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

        `${API}/partidos/${partidoActualId}/goles`

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

        `${API}/estadisticas/goleadores`

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
            `${API}/jugadores`
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

                `${API}/jugadores/${jugador.id}/estadisticas`

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
            `${API}/partidos`
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

            <button
                onclick="modificarPartido(${partido.id})"
            >
                Modificar
            </button>

            <button
                onclick="eliminarPartido(${partido.id})"
            >
                Eliminar
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

            `${API}/partidos/${partidoId}`

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
// MODIFICAR PARTIDO
// ========================================

async function modificarPartido(partidoId) {

    const respuesta =
        await fetch(
            `${API}/partidos/${partidoId}`
        );


    const partido =
        await respuesta.json();


    if (!respuesta.ok) {

        alert(
            "No se pudo cargar el partido."
        );

        return;
    }


    const respuestaJugadores =
        await fetch(
            `${API}/jugadores`
        );


    const todosLosJugadores =
        await respuestaJugadores.json();


    mostrarEditorPartido(
        partido,
        todosLosJugadores
    );
}


// ========================================
// EDITOR DE PARTIDO
// ========================================

function mostrarEditorPartido(
    partido,
    todosLosJugadores
) {

    window.jugadoresParaEditor = todosLosJugadores;
   
    const editorAnterior =
        document.getElementById(
            "editor-partido"
        );


    if (editorAnterior) {
        editorAnterior.remove();
    }


    const jugadoresPartido = {};


    for (const jugador of partido.jugadores.A) {

        jugadoresPartido[jugador.id] = "A";
    }


    for (const jugador of partido.jugadores.B) {

        jugadoresPartido[jugador.id] = "B";
    }


    let jugadoresHTML = "";


    for (const jugador of todosLosJugadores) {

        const ladoActual =
            jugadoresPartido[jugador.id] || "";


        jugadoresHTML += `

            <div
                style="
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 8px 0;
                "
            >

                <strong style="min-width: 120px;">
                    ${jugador.nombre}
                </strong>

                <select
                    id="editor-jugador-${jugador.id}"
                >

                    <option value=""
                        ${ladoActual === "" ? "selected" : ""}>
                        No juega
                    </option>

                    <option value="A"
                        ${ladoActual === "A" ? "selected" : ""}>
                        Equipo A
                    </option>

                    <option value="B"
                        ${ladoActual === "B" ? "selected" : ""}>
                        Equipo B
                    </option>

                </select>

            </div>
        `;
    }


    let golesHTML = "";


    if (partido.goles.length === 0) {

        golesHTML = `
            <p id="sin-goles-editor">
                No hay goles registrados.
            </p>
        `;

    } else {

        for (const gol of partido.goles) {

            golesHTML += crearFilaGolEditor(
                gol,
                todosLosJugadores
            );
        }
    }


    const editor =
        document.createElement("div");


    editor.id =
        "editor-partido";


    editor.style.cssText = `
        position: fixed;
        top: 5%;
        left: 50%;
        transform: translateX(-50%);
        width: 90%;
        max-width: 700px;
        max-height: 90vh;
        overflow-y: auto;
        background: #111;
        color: white;
        border: 2px solid #b6ff00;
        padding: 25px;
        z-index: 9999;
        box-shadow: 0 0 30px rgba(0,0,0,0.8);
    `;


    editor.innerHTML = `

        <h2>
            ⚽ Modificar partido
        </h2>

        <hr>

        <h3>Fecha</h3>

        <input
            type="text"
            id="editor-fecha"
            value="${partido.fecha}"
            placeholder="dd/mm/aaaa"
        >

        <h3>Resultado</h3>

        <div
            style="
                display: flex;
                gap: 15px;
                align-items: center;
            "
        >

            <div>
                🔵 Equipo A
                <input
                    type="number"
                    id="editor-goles-a"
                    min="0"
                    value="${partido.resultado.equipo_a}"
                >
            </div>

            <strong>-</strong>

            <div>
                🔴 Equipo B
                <input
                    type="number"
                    id="editor-goles-b"
                    min="0"
                    value="${partido.resultado.equipo_b}"
                >
            </div>

        </div>

        <hr>

        <h3>Jugadores</h3>

        <div>
            ${jugadoresHTML}
        </div>

        <hr>

        <h3>⚽ Goles registrados</h3>

        <div id="editor-goles">

            ${golesHTML}

        </div>

        <button
            type="button"
            onclick="agregarFilaGolEditor()"
        >
            + Agregar gol
        </button>

        <br><br>

        <button
            type="button"
            onclick="guardarModificacionPartido(${partido.id})"
        >
            GUARDAR CAMBIOS
        </button>

        <button
            type="button"
            onclick="cerrarEditorPartido()"
        >
            CANCELAR
        </button>
    `;


    document.body.appendChild(editor);
}


// ========================================
// CREAR FILA DE GOL
// ========================================

function crearFilaGolEditor(
    gol,
    jugadores
) {

    let opciones = "";


    for (const jugador of jugadores) {

        opciones += `

            <option
                value="${jugador.id}"
                ${Number(gol.jugador_id) === Number(jugador.id)
                    ? "selected"
                    : ""}
            >
                ${jugador.nombre}
            </option>
        `;
    }


    return `

        <div
            class="fila-gol-editor"
            style="
                display: flex;
                gap: 8px;
                align-items: center;
                margin: 8px 0;
                flex-wrap: wrap;
            "
        >

            <select class="editor-gol-jugador">

                ${opciones}

            </select>

            <input
                type="number"
                class="editor-gol-minuto"
                min="0"
                value="${gol.minuto}"
                placeholder="Minuto"
            >

            <select class="editor-gol-lado">

                <option
                    value="A"
                    ${gol.lado === "A" ? "selected" : ""}
                >
                    Equipo A
                </option>

                <option
                    value="B"
                    ${gol.lado === "B" ? "selected" : ""}
                >
                    Equipo B
                </option>

            </select>

            <button
                type="button"
                onclick="this.parentElement.remove()"
            >
                🗑️
            </button>

        </div>
    `;
}


// ========================================
// AGREGAR FILA DE GOL
// ========================================

function agregarFilaGolEditor() {

    const contenedor =
        document.getElementById(
            "editor-goles"
        );


    const mensaje =
        document.getElementById(
            "sin-goles-editor"
        );


    if (mensaje) {
        mensaje.remove();
    }


    const jugadores =
        window.jugadoresParaEditor || [];


    if (jugadores.length === 0) {

        alert(
            "No hay jugadores registrados."
        );

        return;
    }


    contenedor.insertAdjacentHTML(
        "beforeend",
        crearFilaGolEditor(
            {
                jugador_id: jugadores[0].id,
                minuto: 0,
                lado: "A"
            },
            jugadores
        )
    );
}


// ========================================
// GUARDAR MODIFICACION
// ========================================

async function guardarModificacionPartido(
    partidoId
) {

    const fecha =
        document.getElementById(
            "editor-fecha"
        ).value;


    const golesA =
        Number(
            document.getElementById(
                "editor-goles-a"
            ).value
        );


    const golesB =
        Number(
            document.getElementById(
                "editor-goles-b"
            ).value
        );


    if (fecha === "") {

        alert(
            "Seleccioná una fecha."
        );

        return;
    }


    if (golesA < 0 || golesB < 0) {

        alert(
            "Los goles no pueden ser negativos."
        );

        return;
    }


    const jugadores = [];


    for (const jugador of window.jugadoresParaEditor) {

        const select =
            document.getElementById(
                `editor-jugador-${jugador.id}`
            );


        if (
            select &&
            (select.value === "A" ||
             select.value === "B")
        ) {

            jugadores.push({

                jugador_id:
                    Number(jugador.id),

                lado:
                    select.value

            });
        }
    }


    const goles = [];


    document
        .querySelectorAll(
            ".fila-gol-editor"
        )
        .forEach(function(fila) {

            const jugador =
                fila.querySelector(
                    ".editor-gol-jugador"
                ).value;


            const minuto =
                fila.querySelector(
                    ".editor-gol-minuto"
                ).value;


            const lado =
                fila.querySelector(
                    ".editor-gol-lado"
                ).value;


            goles.push({

                jugador_id:
                    Number(jugador),

                minuto:
                    Number(minuto),

                lado:
                    lado

            });
        });


    const respuesta =
        await fetch(
            `${API}/partidos/${partidoId}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    fecha:
                        fecha,

                    goles_a:
                        golesA,

                    goles_b:
                        golesB,

                    jugadores:
                        jugadores,

                    goles:
                        goles

                })
            }
        );


    const resultado =
        await respuesta.json();


    if (!respuesta.ok) {

        console.error(resultado);

        alert(
            "No se pudo modificar el partido: " +
            JSON.stringify(resultado)
        );

        return;
    }


    cerrarEditorPartido();


    await cargarHistorial();


    alert(
        "Partido modificado correctamente."
    );
}


// ========================================
// CERRAR EDITOR
// ========================================

function cerrarEditorPartido() {

    const editor =
        document.getElementById(
            "editor-partido"
        );


    if (editor) {
        editor.remove();
    }
}


// ========================================
// ELIMINAR PARTIDO
// ========================================

async function eliminarPartido(partidoId) {

    const confirmar =
        confirm(
            "¿Seguro que querés eliminar este partido? También se eliminarán sus jugadores y goles registrados."
        );


    if (!confirmar) {
        return;
    }


    const respuesta =
        await fetch(
            `${API}/partidos/${partidoId}`,
            {
                method: "DELETE"
            }
        );


    const resultado =
        await respuesta.json();


    if (!respuesta.ok) {

        console.error(resultado);

        alert(
            "No se pudo eliminar el partido: " +
            JSON.stringify(resultado)
        );

        return;
    }


    await cargarHistorial();


    alert(
        "Partido eliminado correctamente."
    );
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