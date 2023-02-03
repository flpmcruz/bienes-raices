import express from "express";
import { formularioLogin, autenticar, formularioRegistro, registrar, confirmar, formularioOlvidePassword, resetPassword, comprobarToken, nuevoPassword, cerrarSesion } from "../controllers/usuarioController.js";

const router = express.Router()

//Para agrupar una misma ruta
// router.route('/')
//     .get((req, res)=>{
//         res.send('Hola get')
//     })
//     .post((req, res)=>{
//         res.send('Hola post')
//     })
    
router.get('/login', formularioLogin)
router.post('/login', autenticar)

//Cerrar sesion
router.post('/cerrar-sesion', cerrarSesion)

router.get('/registro', formularioRegistro)
router.post('/registro', registrar)
router.get('/confirmar/:token', confirmar)
router.get('/olvide-password', formularioOlvidePassword)
router.post('/olvide-password', resetPassword)

//almacenar el nuevo password
router.get('/olvide-password/:token', comprobarToken)
router.post('/olvide-password/:token', nuevoPassword)

export default router