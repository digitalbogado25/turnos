// script.js (Versión Modificada para usar API)

// --- NUEVA CONSTANTE PARA LA CONEXIÓN AL BACKEND ---
const API_BASE_URL = 'http://localhost:3000/api';
// Si tu servidor Node.js usa otro puerto (ej: 8000), cámbialo aquí.

// Costo fijo de la consulta (se usa en el resumen)
const COSTO_CONSULTA = 15000;

// Estado de la reserva
let reservaSeleccionada = {
    especialidadId: null,
    nombre: '',
    fecha: '',
    hora: ''
};

// 2. ELEMENTOS DEL DOM
const selectEspecialidad = document.getElementById('especialidad');
const inputFecha = document.getElementById('fecha');
const divHorarios = document.getElementById('horarios-disponibles');
const resumenSeleccion = document.getElementById('resumen-seleccion');
const botonReservar = document.getElementById('botonReservar');
const reservaForm = document.getElementById('reservaForm');

// --- Se necesita esta lista solo para rellenar el SELECT inicial ---
const ESPECIALIDADES_INFO = [
    { id: 1, nombre: "Clínica Médica" },
    { id: 2, nombre: "Dermatología" },
    { id: 3, nombre: "Psicología" }
];


/**
 * @function inicializar
 * Carga las opciones de especialidad al iniciar y establece la fecha mínima.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Rellenar el select de especialidades
    ESPECIALIDADES_INFO.forEach(esp => {
        const option = document.createElement('option');
        option.value = esp.id;
        option.textContent = esp.nombre;
        selectEspecialidad.appendChild(option);
    });

    // Establecer la fecha mínima para hoy
    const hoy = new Date();
    const dia = hoy.getDate().toString().padStart(2, '0');
    const mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
    const anio = hoy.getFullYear();
    inputFecha.setAttribute('min', `${anio}-${mes}-${dia}`);
});

/**
 * @function cargarCalendario
 * Habilita el selector de fecha cuando se elige una especialidad.
 */
window.cargarCalendario = function() {
    const espId = selectEspecialidad.value;
    inputFecha.value = ''; // Resetear la fecha
    divHorarios.innerHTML = '<p class="placeholder-info">Seleccione una fecha para ver los horarios.</p>';
    
    if (espId) {
        inputFecha.disabled = false;
        reservaSeleccionada.especialidadId = parseInt(espId);
        reservaSeleccionada.nombre = selectEspecialidad.options[selectEspecialidad.selectedIndex].textContent;
    } else {
        inputFecha.disabled = true;
        reservaSeleccionada.especialidadId = null;
    }
    actualizarResumen();
};

/**
 * @function cargarHorarios
 * Llama al backend para obtener los turnos disponibles.
 */
window.cargarHorarios = async function() {
    const fechaStr = inputFecha.value;
    const especialidadId = reservaSeleccionada.especialidadId;
    
    // Resetear selección de hora
    reservaSeleccionada.fecha = fechaStr;
    reservaSeleccionada.hora = ''; 
    actualizarResumen();

    if (!fechaStr || !especialidadId) {
        divHorarios.innerHTML = '<p class="placeholder-info">Seleccione una fecha y especialidad válidas.</p>';
        return;
    }

    divHorarios.innerHTML = '<p class="placeholder-info">Cargando horarios disponibles...</p>';
    
    try {
        // --- LLAMADA AL BACKEND ---
        const url = `${API_BASE_URL}/disponibilidad?especialidadId=${especialidadId}&fecha=${fechaStr}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Error al obtener la disponibilidad del servidor.');
        }

        const data = await response.json();
        const horariosDisponibles = data.horarios;

        divHorarios.innerHTML = ''; // Limpiar el mensaje de carga

        if (horariosDisponibles.length === 0) {
            const especialidadNombre = reservaSeleccionada.nombre;
            divHorarios.innerHTML = `<p class="placeholder-info">**${especialidadNombre}** no tiene turnos disponibles para esta fecha.</p>`;
            return;
        }

        // Generar los botones de horario
        horariosDisponibles.forEach(horaSlot => {
            const boton = document.createElement('button');
            boton.classList.add('hora-btn');
            boton.type = 'button';
            boton.textContent = horaSlot;
            boton.dataset.hora = horaSlot;
            boton.addEventListener('click', seleccionarHora);
            divHorarios.appendChild(boton);
        });

    } catch (error) {
        console.error("Error en la carga de horarios:", error);
        divHorarios.innerHTML = '<p class="placeholder-info" style="color: red;">No se pudo conectar con el servidor o hubo un error.</p>';
    }
};

/**
 * @function seleccionarHora
 * Maneja el clic en un botón de horario disponible.
 */
function seleccionarHora(event) {
    // 1. Deseleccionar todos los botones previamente seleccionados
    document.querySelectorAll('.hora-btn').forEach(btn => {
        btn.classList.remove('seleccionado');
    });

    // 2. Marcar el botón actual como seleccionado
    event.target.classList.add('seleccionado');

    // 3. Actualizar el estado de la reserva
    reservaSeleccionada.hora = event.target.dataset.hora;
    
    // 4. Actualizar el resumen
    actualizarResumen();
}

/**
 * @function actualizarResumen
 * Muestra la información seleccionada y activa/desactiva el botón de reserva.
 */
function actualizarResumen() {
    const { especialidadId, nombre, fecha, hora } = reservaSeleccionada;
    // ... (Tu código existente para actualizar el resumen) ...
    if (especialidadId && fecha && hora) {
        const fechaFormateada = new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        resumenSeleccion.innerHTML = `
            Turno Seleccionado:
            <ul>
                <li>**Especialidad:** ${nombre}</li>
                <li>**Fecha:** ${fechaFormateada}</li>
                <li>**Hora:** ${hora}</li>
                <li>**Costo:** $${COSTO_CONSULTA.toLocaleString('es-AR')} ARS</li>
            </ul>
            <p>**¡Turno listo para reservar! Complete sus datos para continuar.**</p>
        `;
        botonReservar.disabled = false;
    } else {
        resumenSeleccion.textContent = 'Aún no ha seleccionado un turno completo (Especialidad, Fecha y Hora).';
        botonReservar.disabled = true;
    }
}

/**
 * @function obtenerNombreDia
 * (Esta función ya no es estrictamente necesaria, la mantiene el backend, pero la dejo por si la usas en otra parte.)
 */
function obtenerNombreDia(index) {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[index];
}

/**
 * @function manejarEnvioFormulario
 * Envía la reserva al backend (simulando pago y confirmación).
 */
reservaForm.addEventListener('submit', async function(event) {
    event.preventDefault(); 

    if (!reservaSeleccionada.especialidadId || !reservaSeleccionada.fecha || !reservaSeleccionada.hora) {
        alert("Error: Debe seleccionar una especialidad, fecha y hora.");
        return;
    }
    
    // --- Recolección de datos y preparación para el envío ---
    const montoAbonar = COSTO_CONSULTA; // SIMULADO: Asumimos pago total

    const datosReserva = {
        especialidadId: reservaSeleccionada.especialidadId,
        fecha: reservaSeleccionada.fecha,
        hora: reservaSeleccionada.hora,
        nombre: document.getElementById('nombre').value,
        dni: document.getElementById('dni').value,
        telefono: document.getElementById('telefono').value,
        email: document.getElementById('email').value,
        esPrimeraVez: document.getElementById('primeraVez').value, // 'si' o 'no'
        montoAbonado: montoAbonar
    };

    botonReservar.disabled = true;
    botonReservar.textContent = "Procesando Pago y Reserva...";

    try {
        // --- ENVÍO AL BACKEND ---
        const response = await fetch(`${API_BASE_URL}/reservar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosReserva)
        });

        const result = await response.json();

        if (response.ok) {
            // Éxito
            alert(`✅ ¡Reserva Confirmada!\nTurno para ${result.turno.nombre_apellido} el ${result.turno.fecha} a las ${result.turno.hora}.\n\nMonto Pendiente: $${result.monto_pendiente.toLocaleString('es-AR')}`);
            
            reservaForm.reset();
            cargarCalendario();
        } else {
            // Error del servidor (ej: 409 Conflict - turno tomado)
            alert(`❌ Error al reservar: ${result.error || 'Hubo un error desconocido.'}`);
        }

    } catch (error) {
        console.error("Error de conexión:", error);
        alert("❌ Error de conexión con el servidor. Asegúrese de que server.js esté corriendo.");
    } finally {
        botonReservar.disabled = false;
        botonReservar.textContent = "Ir a Pagar y Confirmar Reserva";
    }
});