import { Sequelize } from 'sequelize'
import { Precio, Categoria, Propiedad } from '../models/index.js'

const inicio = async(req, res) => {

    const categorias = await Categoria.findAll({raw: true})

    const [precios, casas, departamentos ] = await Promise.all([
        Precio.findAll({raw: true}),
        Propiedad.findAll({
            limit: 3,
            where: {
                categoriaId: categorias[0].id
            },
            include: [
                {model: Precio, as: 'precio'},
            ],
            order: [
                ['createdAt', 'DESC']
            ]
        }),
        Propiedad.findAll({
            limit: 3,
            where: {
                categoriaId: categorias[1].id
            },
            include: [
                {model: Precio, as: 'precio'},
            ],
            order: [
                ['createdAt', 'DESC']
            ]
        }),
    ])

    console.log(casas + ' CASAS')

    res.render('inicio', {
        pagina: 'Inicio',
        categorias,
        precios,
        casas,
        departamentos,
        csrfToken: req.csrfToken()
    })
}

const categoria = async(req, res) => {
    const { id } = req.params

    //validar categoria exista
    const categoria = await Categoria.findByPk(id)
    if(!categoria) {
        return res.redirect('/404')
    }

    //obtener propiedades
    const propiedades = await Propiedad.findAll({
        limit: 3,
        where: {
            categoriaId: id
        },
        include: [
            {model: Precio, as: 'precio'},
        ],
    })

    res.render('categoria', {
        pagina: `${categoria.nombre}s en Venta`,
        propiedades,
        csrfToken: req.csrfToken()
    })
}

const noEncontrado = (req, res) => {
    res.render('404',{
        pagina: 'No Encontrada',
        csrfToken: req.csrfToken()
    })
}

const buscador = async(req, res) => {
    const { termino } = req.body

    if(!termino.trim()){
        res.redirect('back')
    }

    //consultar propiedades
    const propiedades = await Propiedad.findAll({
        where: {
            titulo: {
                [Sequelize.Op.like] : '%' + termino + '%'
            }
        },
        include: [
            {model: Precio, as: 'precio'},
        ],
    })

    res.render('busqueda', {
        pagina: `Resultados de la Búsqueda`,
        propiedades,
        csrfToken: req.csrfToken()
    })
}

export {
    inicio,
    categoria,
    noEncontrado,
    buscador
}