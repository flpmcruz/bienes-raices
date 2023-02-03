import { Dropzone } from 'dropzone'

const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content')

//imagen es el id en el componente donde se va a montar
Dropzone.options.imagen = {
    dictDefaultMessage: 'Sube tus imágenes aquí',
    acceptedFiles: '.png, .jpg, .jpeg',
    maxFilesize: 5,
    maxFiles: 1,
    paralleUploads: 1,
    autoProcessQueue: false,
    addRemoveLinks: true,
    dictRemoveFile: 'Eliminar',
    dictMaxFilesExceeded: 'El límite es un archivo',
    headers: {
        'CSRF-Token': token
    },
    paramName: 'imagen',
    init: function() {
        const dropzone = this
        const btnPublicar = document.querySelector('#publicar')

        btnPublicar.addEventListener('click', function(){
            dropzone.processQueue()
        })

        dropzone.on('queuecomplete', function(file, mensaje) {
            if(dropzone.getActiveFiles().length == 0 ){
                window.location.href = '/mis-propiedades'
            }
        })
    }
}