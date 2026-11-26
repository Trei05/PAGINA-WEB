const secciones = {
    bienvenida: document.getElementById("bienvenida"),
    registro: document.getElementById("registro"),
    unirse: document.getElementById("unirse"),
    sala: document.getElementById("sala"),
    consulta: document.getElementById("consulta")
};

function mostrarSeccion(nombreSeccion) {
    Object.values(secciones).forEach((sec) => sec.classList.add("oculto"));
    if (secciones[nombreSeccion]) {
        secciones[nombreSeccion].classList.remove("oculto");
    }
}

document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => mostrarSeccion(btn.dataset.target));
});

document.getElementById("btnComenzar").addEventListener("click", () => mostrarSeccion("registro"));
document.getElementById("btnIrUnirse").addEventListener("click", () => mostrarSeccion("unirse"));
document.getElementById("btnIrSala").addEventListener("click", () => mostrarSeccion("sala"));
document.getElementById("btnIrConsulta").addEventListener("click", () => mostrarSeccion("consulta"));

// Etapa 1: Crear intercambio
const formCrearIntercambio = document.getElementById("formCrearIntercambio");
const mensaje = document.getElementById("mensaje");
const resultadoIntercambio = document.getElementById("resultadoIntercambio");
const btnCrearIntercambio = document.getElementById("btnCrearIntercambio");

formCrearIntercambio.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const nombre = document.getElementById("evento").value.trim();
    const fecha = document.getElementById("fecha").value.trim();
    const cantidad = Number.parseInt(document.getElementById("cantidad").value.trim(), 10);

    mensaje.textContent = "";
    resultadoIntercambio.classList.add("oculto");
    resultadoIntercambio.innerHTML = "";

    if (!nombre || nombre.length > 100) {
        mensaje.textContent = "Ingresa un nombre válido para el intercambio (máximo 100 caracteres).";
        return;
    }

    if (!Number.isInteger(cantidad) || cantidad < 2 || cantidad > 100) {
        mensaje.textContent = "La cantidad debe estar entre 2 y 100 participantes.";
        return;
    }

    btnCrearIntercambio.disabled = true;
    btnCrearIntercambio.textContent = "Creando...";

    try {
        const respuesta = await fetch("backend/api/crear_intercambio.php", {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({ nombre, fecha, cantidad })
        });
        const data = await respuesta.json();

        if (!respuesta.ok || !data.success) {
            mensaje.textContent = data.message || "No se pudo crear el intercambio.";
            return;
        }

        mensaje.textContent = data.message;
        const c = data.intercambio;
        resultadoIntercambio.innerHTML = `
            <p><strong>Código de acceso:</strong> <span>${c.codigo}</span></p>
            <p><strong>Intercambio:</strong> ${c.nombre}</p>
            <p><strong>Participantes:</strong> ${c.cantidad}</p>
            <p><strong>Fecha del evento:</strong> ${c.fecha || "No definida"}</p>
            <p><strong>Estado:</strong> ${c.estado}</p>
        `;
        resultadoIntercambio.classList.remove("oculto");
        formCrearIntercambio.reset();

        document.getElementById("codigoUnirse").value = c.codigo;
        document.getElementById("codigoSala").value = c.codigo;
        document.getElementById("codigoConsulta").value = c.codigo;
    } catch (error) {
        console.error(error);
        mensaje.textContent = "Ocurrió un error de comunicación con el servidor.";
    } finally {
        btnCrearIntercambio.disabled = false;
        btnCrearIntercambio.textContent = "Crear intercambio";
    }
});

// Etapa 2: Registrar participante
const formRegistrarParticipante = document.getElementById("formRegistrarParticipante");
const mensajeParticipante = document.getElementById("mensajeParticipante");
const resultadoParticipante = document.getElementById("resultadoParticipante");
const btnRegistrarParticipante = document.getElementById("btnRegistrarParticipante");

formRegistrarParticipante.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const codigo = document.getElementById("codigoUnirse").value.trim().toUpperCase();
    const nombre = document.getElementById("nombreParticipante").value.trim();
    const correo = document.getElementById("correoParticipante").value.trim();
    const pin = document.getElementById("pinParticipante").value;

    mensajeParticipante.textContent = "";
    resultadoParticipante.classList.add("oculto");
    resultadoParticipante.innerHTML = "";

    if (!codigo || !nombre || !correo || pin.length < 4 || pin.length > 12) {
        mensajeParticipante.textContent = "Revisa los campos: el PIN debe tener entre 4 y 12 caracteres.";
        return;
    }

    btnRegistrarParticipante.disabled = true;
    btnRegistrarParticipante.textContent = "Registrando...";

    try {
        const respuesta = await fetch("backend/api/registrar_participante.php", {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({ codigo, nombre, correo, pin })
        });
        const data = await respuesta.json();

        if (!respuesta.ok || !data.success) {
            mensajeParticipante.textContent = data.message || "No se pudo completar el registro.";
            return;
        }

        mensajeParticipante.textContent = data.message;
        resultadoParticipante.innerHTML = `
            <p><strong>Participante:</strong> ${data.participante.nombre}</p>
            <p><strong>Registrados:</strong> ${data.resumen.registrados} de ${data.resumen.limite}</p>
            <p><strong>Cupos disponibles:</strong> ${data.resumen.cuposDisponibles}</p>
        `;
        resultadoParticipante.classList.remove("oculto");
        formRegistrarParticipante.reset();

        document.getElementById("codigoUnirse").value = codigo;
        document.getElementById("codigoSala").value = codigo;
        document.getElementById("codigoConsulta").value = codigo;
    } catch (error) {
        console.error(error);
        mensajeParticipante.textContent = "Ocurrió un error de comunicación con el servidor.";
    } finally {
        btnRegistrarParticipante.disabled = false;
        btnRegistrarParticipante.textContent = "Registrar participante";
    }
});

// Etapa 3 y 4: Sala de espera y Sorteo
const formBuscarSala = document.getElementById("formBuscarSala");
const mensajeSala = document.getElementById("mensajeSala");
const detalleSala = document.getElementById("detalleSala");
const bloqueSorteo = document.getElementById("bloqueSorteo");
const btnSortear = document.getElementById("btnSortear");
const textoSorteo = document.getElementById("textoSorteo");
const mensajeSorteo = document.getElementById("mensajeSorteo");

let codigoSalaActual = "";

async function cargarSala(codigo) {
    mensajeSala.textContent = "";
    mensajeSorteo.textContent = "";

    try {
        const respuesta = await fetch(`backend/api/estado_sala.php?codigo=${encodeURIComponent(codigo)}`);
        const data = await respuesta.json();

        if (!respuesta.ok || !data.success) {
            detalleSala.classList.add("oculto");
            bloqueSorteo.classList.add("oculto");
            mensajeSala.textContent = data.message || "No se pudo cargar la sala.";
            return;
        }

        codigoSalaActual = data.intercambio.codigo;
        const { intercambio, resumen, participantes } = data;

        const listaHtml = participantes.length
            ? participantes.map((p) => `<li>${p.nombre}</li>`).join("")
            : "<li>Aún no hay participantes registrados.</li>";

        detalleSala.innerHTML = `
            <div class="tarjeta-resultado">
                <p><strong>Intercambio:</strong> ${intercambio.nombre} (${intercambio.codigo})</p>
                <p><strong>Estado:</strong> ${intercambio.estado}</p>
                <p><strong>Registrados:</strong> ${resumen.registrados} de ${resumen.limite} | <strong>Cupos libres:</strong> ${resumen.cuposDisponibles}</p>
                <ul class="lista-participantes">${listaHtml}</ul>
            </div>
        `;
        detalleSala.classList.remove("oculto");

        bloqueSorteo.classList.remove("oculto");
        if (intercambio.estado === "Abierto") {
            btnSortear.disabled = !resumen.listoParaSorteo;
            textoSorteo.textContent = resumen.listoParaSorteo
                ? "¡Todos los participantes están registrados! Ya pueden realizar el sorteo."
                : "Aún faltan participantes por registrarse para habilitar el sorteo.";
        } else {
            btnSortear.disabled = true;
            textoSorteo.textContent = "El sorteo ya fue realizado. Ve a 'Mi Asignación' para consultar el tuyo.";
        }
    } catch (error) {
        console.error(error);
        mensajeSala.textContent = "Error de comunicación al consultar la sala.";
    }
}

formBuscarSala.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const codigo = document.getElementById("codigoSala").value.trim().toUpperCase();
    if (!codigo) return;
    await cargarSala(codigo);
});

btnSortear.addEventListener("click", async () => {
    mensajeSorteo.textContent = "";
    if (!codigoSalaActual) return;

    btnSortear.disabled = true;
    try {
        const respuesta = await fetch("backend/api/sortear.php", {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({ codigo: codigoSalaActual })
        });
        const data = await respuesta.json();
        mensajeSorteo.textContent = data.message || "";
        await cargarSala(codigoSalaActual);
    } catch (error) {
        console.error(error);
        mensajeSorteo.textContent = "Error al ejecutar el sorteo.";
    }
});

// Etapa 5: Consulta privada
const formConsultaAsignacion = document.getElementById("formConsultaAsignacion");
const mensajeConsulta = document.getElementById("mensajeConsulta");
const resultadoAsignacion = document.getElementById("resultadoAsignacion");

formConsultaAsignacion.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    mensajeConsulta.textContent = "";
    resultadoAsignacion.classList.add("oculto");
    resultadoAsignacion.innerHTML = "";

    const codigo = document.getElementById("codigoConsulta").value.trim().toUpperCase();
    const correo = document.getElementById("correoConsulta").value.trim();
    const pin = document.getElementById("pinConsulta").value;

    try {
        const respuesta = await fetch("backend/api/mi_asignacion.php", {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({ codigo, correo, pin })
        });
        const data = await respuesta.json();

        if (!respuesta.ok || !data.success) {
            mensajeConsulta.textContent = data.message || "No se pudo consultar la asignación.";
            return;
        }

        resultadoAsignacion.innerHTML = `
            <p><strong>Intercambio:</strong> ${data.intercambio}</p>
            <p><strong>Hola ${data.participante}, te corresponde regalar a:</strong></p>
            <p class="destacado-asignado">🎁 ${data.asignadoA}</p>
        `;
        resultadoAsignacion.classList.remove("oculto");
    } catch (error) {
        console.error(error);
        mensajeConsulta.textContent = "Error al consultar tu asignación.";
    }
});