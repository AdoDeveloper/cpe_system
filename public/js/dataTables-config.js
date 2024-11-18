// Archivo general para inicializar DataTables public/js/dataTables-config.js
$(document).ready(function () {
    // Inicializar todas las tablas con la clase "datatable" usando la misma configuración
    $('.datatable').DataTable({
        "paging": true,
        "pageLength": 10,
        "lengthChange": true,
        "searching": true,
        "ordering": false,
        "info": false,
        "autoWidth": false,
        "responsive": false,  // Desactiva responsive para habilitar scroll si es necesario
        "scrollX": false,     // Cambiar a true si deseas scroll horizontal en todas las tablas
        "processing": true,
        "language": {
            "processing": "Cargando datos, por favor espera...",
            "sProcessing": "Procesando...",
            "sLengthMenu": "Mostrar _MENU_ registros",
            "sZeroRecords": "No se encontraron resultados",
            "sEmptyTable": "Ningún dato disponible en esta tabla",
            "sInfo": "Mostrando registros del _START_ al _END_ de un total de _TOTAL_ registros",
            "sInfoEmpty": "Mostrando registros del 0 al 0 de un total de 0 registros",
            "sInfoFiltered": "(filtrado de un total de _MAX_ registros)",
            "sSearch": "Buscar:",
            "oPaginate": {
                "sFirst": "Primero",
                "sLast": "Último",
                "sNext": "Siguiente",
                "sPrevious": "Anterior"
            }
        }
    });
});
