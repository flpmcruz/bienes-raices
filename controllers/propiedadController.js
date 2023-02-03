import { unlink } from 'node:fs/promises'
import { validationResult } from 'express-validator'
import { Categoria, Precio, Propiedad, Mensaje, Usuario } from '../models/index.js'
import { esVendedor, formatearFecha } from '../helpers/index.js'
 
const admin = async(req, res) => {

    const { page } = req.query || 1
    const regx = /^[1-9]$/

    //devuelve true o false
    if(!regx.test(page)){
        res.redirect('/mis-propiedades?page=1')
    }

    try {
        const { id: usuarioId } = req.usuario

        //limites y offset
        const limit = 3
        const offset = ((page * limit) - limit)
    
        const [propiedades, total] = await Promise.all([
            Propiedad.findAll({
                limit,
                offset,
                where: {
                    usuarioId
                },
                include: [
                    { model: Categoria, as: 'categoria'},
                    { model: Precio, as: 'precio'},
                    { model: Mensaje, as: 'mensajes'},
                ]
            }),
            Propiedad.count({
                where: {
                    usuarioId
                }
            })
        ])
    
        res.render('propiedades/admin', {
            pagina: 'Mis Propiedades',
            csrfToken: req.csrfToken(),
            propiedades,
            total,
            offset,
            limit,
            page: Number(page), //la pagina actual
            pages: Math.ceil(total / limit) // calcula la cantidad de paginas del paginador y redondea hacia arriba
        });
        
    } catch (error) {
        console.log(error)
    }

}

//Formulario para crear una nueva propiedad
const crear = async(req, res) => {
    //Consultar Modelo Categoria y de Precio
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])

    res.render('propiedades/crear', {
        pagina: 'Crear Propiedad',
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos: {}
    });
}

const guardar = async(req, res) => {
    //validacion
    let resultado = validationResult(req)
    
    if(!resultado.isEmpty()){
        //Consultar Modelo Categoria y de Precio
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ])
        return res.render('propiedades/crear', {
            pagina: 'Crear Propiedad',
            csrfToken: req.csrfToken(),
            categorias,
            precios,
            errores: resultado.array(),
            datos: req.body
        });
    }

    //crear un registro
    const { titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precio: precioId, categoria: categoriaId } = req.body

    const { id: usuarioId  } = req.usuario

    try {
        const propiedadGuardada = await Propiedad.create({
            titulo,
            descripcion,
            habitaciones,
            estacionamiento,
            wc,
            calle,
            lat,
            lng,
            precioId,
            categoriaId,
            usuarioId,
            imagen: ''
        })

        const { id } = propiedadGuardada
        res.redirect(`/propiedades/agregar-imagen/${id}`);
        
    } catch (error) {
        console.log(error)
    }
}

const agregarImagen = async(req, res) => {

    const {id} = req.params

    //que exista la propiedad
    const propiedad = await Propiedad.findByPk(id)
    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    //que ya no este publicada
    if(propiedad.publicado){
        return res.redirect('/mis-propiedades')
    }

    //que pertenece a quien visite esta pagina
    if(req.usuario.id.toString() !== propiedad.usuarioId.toString()){
        return res.redirect('/mis-propiedades')
    }

    res.render('propiedades/agregar-imagen', {
        pagina: `Agregar Imagen: ${propiedad.titulo}`,
        propiedad,
        csrfToken: req.csrfToken(),
    });
}

const subirImagen = async(req, res, next) => {
    const {id} = req.params

    //que exista la propiedad
    const propiedad = await Propiedad.findByPk(id)
    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    //que ya no este publicada
    if(propiedad.publicado){
        return res.redirect('/mis-propiedades')
    }

    //que pertenece a quien visite esta pagina
    if(req.usuario.id.toString() !== propiedad.usuarioId.toString()){
        return res.redirect('/mis-propiedades')
    }

    try {
        //almacenar imagen y publicar
        propiedad.imagen = req.file.filename
        propiedad.publicado = 1

        await propiedad.save()

        next()

    } catch (error) {
        console.log(error)
    }
}

const editar = async(req, res) => {

    const { id } = req.params

    const propiedad = await Propiedad.findByPk(id)

    //validar que la propiedad exista
    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    //validar que la propiedad pertenezca al que la visita
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString()){
        return res.redirect('/mis-propiedades')
    }

    //Consultar Modelo Categoria y de Precio
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])

    res.render('propiedades/editar', {
        pagina: 'Editar Propiedad',
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        datos: propiedad
    });
}

const guardarCambios = async(req, res) => {

    //validacion
    let resultado = validationResult(req)
    
    if(!resultado.isEmpty()){
        //Consultar Modelo Categoria y de Precio
        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ])
        return res.render('propiedades/editar', {
            pagina: `Editar Propiedad`,
            csrfToken: req.csrfToken(),
            categorias,
            precios,
            errores: resultado.array(),
            datos: req.body
        });
    }

    const { id } = req.params

    const propiedad = await Propiedad.findByPk(id)

    //validar que la propiedad exista
    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    //validar que la propiedad pertenezca al que la visita
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString()){
        return res.redirect('/mis-propiedades')
    }

    //Reescribir el objeto y actualizarlo
    try {
        const { titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precio: precioId, categoria: categoriaId } = req.body

        propiedad.set({
            titulo,
            descripcion,
            habitaciones,
            estacionamiento,
            wc,
            calle,
            lat,
            lng,
            precioId,
            categoriaId
        })

        await propiedad.save()
        res.redirect('/mis-propiedades')

    } catch (error) {
        console.log(error)
    }
}

const eliminar = async(req, res) => {
    const { id } = req.params

    const propiedad = await Propiedad.findByPk(id)

    //validar que la propiedad exista
    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    //validar que la propiedad pertenezca al que la visita
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString()){
        return res.redirect('/mis-propiedades')
    }
    
    //eliminar la propiedad
    await propiedad.destroy()

    //eliminar la imagen asociada
    await unlink(`public/uploads/${propiedad.imagen}`)

    res.redirect('/mis-propiedades')
}

//modifica el estado
const cambiarEstado = async(req, res) => {
    const { id } = req.params

    const propiedad = await Propiedad.findByPk(id)

    //validar que la propiedad exista
    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    //validar que la propiedad pertenezca al que la visita
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString()){
        return res.redirect('/mis-propiedades')
    }

    //Actualizar
    propiedad.publicado = !propiedad.publicado
    await propiedad.save()

    res.json({
        resultado: true
    })
}

const mostrarPropiedad = async(req, res) => {
    const { id } = req.params

    const propiedad = await Propiedad.findByPk(id, {
        include: [
            { model: Categoria, as: 'categoria'},
            { model: Precio, as: 'precio'},
        ]
    })

    //validar que la propiedad exista
    if(!propiedad || !propiedad.publicado){
        return res.redirect('/404')
    }

    res.render('propiedades/mostrar', {
        propiedad,
        pagina: propiedad.titulo,
        csrfToken: req.csrfToken(),
        usuario: req.usuario,
        esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId)
    })
}

const enviarMensaje = async(req, res) => {
    const { id } = req.params

    const propiedad = await Propiedad.findByPk(id, {
        include: [
            { model: Categoria, as: 'categoria'},
            { model: Precio, as: 'precio'},
        ]
    })

    //validar que la propiedad exista
    if(!propiedad){
        return res.redirect('/404')
    }

    //Renderizar los errores
    let resultado = validationResult(req)
    
    if(!resultado.isEmpty()){
        return res.render('propiedades/mostrar', {
            propiedad,
            pagina: propiedad.titulo,
            csrfToken: req.csrfToken(),
            usuario: req.usuario,
            esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
            errores: resultado.array()
        })
    }

    const { mensaje } = req.body
    const { id: propiedadId } = req.params
    const { id: usuarioId } = req.usuario

    //Almacenar mensaje
    await Mensaje.create({
        mensaje,
        propiedadId,
        usuarioId
    })

     res.redirect('/');
}

//leer mensajes recibidos
const verMensajes = async(req, res) => {
    const { id } = req.params

    const propiedad = await Propiedad.findByPk(id, {
        include: [
            { model: Mensaje, as: 'mensajes', 
                include: [
                    { model: Usuario.scope('eliminarPassword'), as: 'usuario'},
                ]
            },
        ]
    })

    //validar que la propiedad exista
    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    //validar que la propiedad pertenezca al que la visita
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString()){
        return res.redirect('/mis-propiedades')
    }

    res.render('propiedades/mensajes', {
        pagina: 'Mensajes',
        mensajes: propiedad.mensajes,
        formatearFecha
    })
}

export {
    admin,
    crear,
    guardar,
    agregarImagen,
    subirImagen,
    editar,
    guardarCambios,
    eliminar,
    cambiarEstado,
    mostrarPropiedad,
    enviarMensaje,
    verMensajes
}