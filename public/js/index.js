// Función general para mostrar el SweetAlert con spinner y enviar el formulario
function mostrarSpinnerYEnviar(formId, titulo, mensaje) {
    const form = document.getElementById(formId);

    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevenir el envío inmediato del formulario
            
            // Mostrar SweetAlert con spinner
            Swal.fire({
                title: titulo,
                text: mensaje,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Enviar el formulario después de mostrar el spinner
            this.submit();
        });
    }
}

// Asocia la función a los formularios correspondientes
document.addEventListener('DOMContentLoaded', function() {
    mostrarSpinnerYEnviar('alertFormEdit', 'Guardando cambios...', 'Por favor, espera mientras se procesan los cambios.');
    mostrarSpinnerYEnviar('alertFormSave', 'Guardando...', 'Por favor, espera mientras se procesa tu solicitud.');
});
