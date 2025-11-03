// app.js

// Mapeo de números de día (0=Domingo, 1=Lunes, ..., 6=Sábado) a nombres en español
const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Estructura de datos con DÍAS DE LA SEMANA disponibles
const ESPECIALIDADES = {
    clinica_medica: {
        dias_semana: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
        horario: '10:00 a 14:00 hs'
    },
    psicologia: {
        dias_semana: ['Miércoles'],
        horario: '10:00 a 14:00 hs'
    },
    dermatologia: {
        dias_semana: ['Viernes'],
        horario: '12:30 a 16:00 hs'
    },
    neurologia: {
        dias_semana: ['Miércoles'],
        horario: '13:00 a 17:00 hs'
    }
};

const COSTO_CONSULTA = '15.000';
const WHATSAPP_NUMBER = '5491161205922'; 

const form = document.getElementById('reservaForm');
const inputNombre = document.getElementById('nombre');
const inputDni = document.getElementById('dni');
const selectTipoPaciente = document.getElementById('tipo_paciente'); 
const selectEspecialidad = document.getElementById('especialidad');
const inputFecha = document.getElementById('fecha_turno');
const diaAyuda = document.getElementById('diaAyuda');
const btnReservar = document.getElementById('btnReservar');

// Inicializar el campo de fecha: no permitir fechas pasadas
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const minDate = `${yyyy}-${mm}-${dd}`;
inputFecha.setAttribute('min', minDate);

// Función para actualizar el estado del selector de fecha
function actualizarSelectorFecha() {
    const especialidadSeleccionada = selectEspecialidad.value;
    const infoEspecialidad = ESPECIALIDADES[especialidadSeleccionada];

    if (infoEspecialidad) {
        inputFecha.disabled = false;
        const dias = infoEspecialidad.dias_semana.join(', ');
        diaAyuda.textContent = `Disponible solo los días: ${dias}`;
        diaAyuda.style.color = 'var(--color-primario-base)';
    } else {
        inputFecha.disabled = true;
        inputFecha.value = '';
        diaAyuda.textContent = 'Selecciona una especialidad primero.';
        diaAyuda.style.color = 'gray';
    }
    checkFormValidity();
}

// Función para verificar si la fecha seleccionada es válida para la especialidad
function validarDiaYFecha() {
    const fechaSeleccionada = inputFecha.value;
    const especialidadKey = selectEspecialidad.value;

    if (!fechaSeleccionada || !especialidadKey) {
        return false;
    }

    const fecha = new Date(fechaSeleccionada + 'T00:00:00'); 
    const diaIndex = fecha.getDay();
    const diaNombre = DIAS_SEMANA[diaIndex];
    
    const diasPermitidos = ESPECIALIDADES[especialidadKey].dias_semana;

    const esValido = diasPermitidos.includes(diaNombre);

    if (esValido) {
        inputFecha.classList.remove('is-invalid');
        inputFecha.classList.add('is-valid');
    } else {
        inputFecha.classList.remove('is-valid');
        inputFecha.classList.add('is-invalid');
    }
    
    return esValido;
}


// Función para habilitar/deshabilitar el botón de reserva
function checkFormValidity() {
    const todosLlenos = (
        inputNombre.value.trim() && 
        inputDni.value.trim() &&
        selectTipoPaciente.value && 
        selectEspecialidad.value &&
        inputFecha.value.trim()
    );

    const diaYFechaValidos = validarDiaYFecha();

    btnReservar.disabled = !(todosLlenos && diaYFechaValidos);
}


// Event Listeners
selectEspecialidad.addEventListener('change', actualizarSelectorFecha);
selectEspecialidad.addEventListener('change', checkFormValidity);

inputNombre.addEventListener('input', checkFormValidity);
inputDni.addEventListener('input', checkFormValidity);
selectTipoPaciente.addEventListener('change', checkFormValidity);
inputFecha.addEventListener('change', checkFormValidity);


// Manejar el envío del formulario: Generar URL de WhatsApp
form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!validarDiaYFecha()) {
        alert('Por favor, selecciona una fecha válida que coincida con la disponibilidad de la especialidad.');
        return;
    }

    const nombrePaciente = inputNombre.value.trim();
    const dniPaciente = inputDni.value.trim();
    const tipoPacienteKey = selectTipoPaciente.value;
    const especialidadKey = selectEspecialidad.value;
    const info = ESPECIALIDADES[especialidadKey];
    
    // Formateo de fecha
    const fecha = new Date(inputFecha.value + 'T00:00:00');
    const fechaFormateada = fecha.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const especialidadNombre = selectEspecialidad.options[selectEspecialidad.selectedIndex].textContent;
    
    // **CAMBIO A LA NUEVA REDACCIÓN**
    let historialMensaje;
    if (tipoPacienteKey === 'existente') {
        historialMensaje = 'SÍ, soy paciente (Historial Existente)';
    } else {
        historialMensaje = 'NO, es la primera vez (Crear ficha)';
    }

    // 1. Construir el mensaje de WhatsApp pre-cargado
    const mensaje = `*Bienvenido a Servicio Médico V. Albertina.*
    
* **Apellido y Nombre:** ${nombrePaciente}
* **DNI:** ${dniPaciente}
* **Historial Clínica:** ${historialMensaje}
---
**SOLICITUD DE TURNO (A CONFIRMAR)**
    
* **Especialidad:** ${especialidadNombre}
* **Fecha Solicitada:** ${fechaFormateada}
* **Horario de Atención:** ${info.horario}
* **Costo:** $${COSTO_CONSULTA}
    
Por favor, envíenme el link de Mercado Pago o confirmen si puedo pagar en Efectivo ese día. Quedo atento a la asignación de mi Número de Orden una vez concretado el pago.`;

    // 2. Codificar el mensaje para la URL
    const mensajeCodificado = encodeURIComponent(mensaje.trim());

    // 3. Construir el enlace final de WhatsApp
    const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${mensajeCodificado}`;

    // 4. Redirigir al usuario
    window.open(whatsappURL, '_blank');
});