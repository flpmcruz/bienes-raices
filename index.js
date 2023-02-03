import express from 'express'
import csrf from 'csurf'
import cookieParser from 'cookie-parser'
import usuarioRoutes from './routes/usuarioRoutes.js'
import propiedadesRoutes from './routes/propiedadesRoutes.js'
import appRoutes from './routes/appRoutes.js'
import apiRoutes from './routes/apiRoutes.js'
import db from './config/db.js'

const app = express()

//Habilitar lectura de form
app.use(express.urlencoded({extended: true}))

//conexion a la db
try {
    await db.authenticate();
    await db.sync();
    console.log('Conexion correcta')
} catch (error) {
    console.log(error)
}

//Habilitar Cookie Parser
app.use( cookieParser() )

//Habilitar CSRF
app.use( csrf({cookie: true}) )

//Habilitar pug
app.set('view engine', 'pug')
app.set('views', './views')

//Carpeta publica
app.use( express.static('public'))

//Routing
app.use('/auth', usuarioRoutes)
app.use('/', propiedadesRoutes)
app.use('/', appRoutes)
app.use('/api', apiRoutes)
app.use('*', (req, res)=> res.redirect('/404'))

//Definir puerto
const port = process.env.PORT || 3000

app.listen(port, ()=>{
    console.log('Server runnig on port ' + port)
})