import categorias from './categorias.js'
import precios from './precios.js'
import usuarios from './usuarios.js'
import db from '../config/db.js'

import { Categoria, Precio, Propiedad, Usuario } from '../models/index.js'

Propiedad.sync({force: true})

const importarDatos = async() => {
    try {
        //Autenticar
        await db.authenticate()

        //Generar las columnas
        await db.sync()

        //Insertamos los datos
        await Promise.all([            
            Categoria.bulkCreate(categorias),
            Precio.bulkCreate(precios),
            Usuario.bulkCreate(usuarios)
        ])

        console.log('Datos insertados correctamente')
        process.exit(0)

    } catch (error) {
        console.log(error)
        process.exit(1) //finaliza pero hubo un error
    }
}

const eliminarDatos = async()=> {
    try {
        await Promise.all([            
            Categoria.destroy({where: {}, }),
            Precio.destroy({where: {}, }),
            Usuario.destroy({where: {}, }),
        ])
        console.log('Datos elimnados correctamente')
        process.exit(0)
    } catch (error) {
        console.log(error)
        process.exit(1) //finaliza pero hubo un error
    }
}

if(process.argv[2] === "-i"){
    importarDatos();
}

if(process.argv[2] === "-e"){
    eliminarDatos();
}