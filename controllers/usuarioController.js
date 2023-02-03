import { check, validationResult } from 'express-validator'
import bcrypt from 'bcrypt'

import Usuario from '../models/Usuario.js'
import { generarId, generarJWT } from '../helpers/tokens.js'
import { emailRegistro, emailOlvidePassword } from '../helpers/emails.js'

const formularioLogin = (req, res) => {
    res.render('auth/login', {
        pagina: 'Iniciar Sesión',
        csrfToken: req.csrfToken()
     })
}

const autenticar = async(req, res) => {
    await check('email').isEmail().withMessage('El email es requerido').run(req)
    await check('password').notEmpty().withMessage('El password es requerido').run(req)

    let resultado = validationResult(req)

    if(!resultado.isEmpty()){
        return res.render('auth/login', {
            pagina: 'Iniciar sesion',
            csrfToken: req.csrfToken(),
            errores: resultado.array(),
        })
    }

    const { email, password } = req.body

    //Verificar usuario exista
    const usuario = await Usuario.findOne({ where: {email}})

    if(!usuario){
        return res.render('auth/login', {
            pagina: 'Iniciar sesion',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'Hubo un error al iniciar sesion. Intenta de nuevo'}]
        });
    }

    if(!usuario.confirmado){
        return res.render('auth/login', {
            pagina: 'Iniciar sesion',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'Tu cuenta no esta confirmado'}]
        });
    }

    //comprobar password
    if(!usuario.verificarPassword(password)){
        return res.render('auth/login', {
            pagina: 'Iniciar sesion',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'Password incorrecto'}]
        });
    }

    //autenticar al usuario
    const token = generarJWT({ usuario: usuario.id, nombre: usuario.nombre })

    return res.cookie('_token', token, {
        httpOnly: true,
        //secure: true,
        //sameSite: true
    }).redirect('/mis-propiedades')
    
}

const cerrarSesion = (req, res) => {
    return res.clearCookie('_token').status(200).redirect('/auth/login')
}

const formularioRegistro = (req, res) => {
    res.render('auth/registro', {
        pagina: 'Crear Cuenta',
        csrfToken: req.csrfToken()
     })
}

const registrar = async (req, res) => {
    //validacion de campos
    await check('nombre').notEmpty().withMessage('El nombre no puede estar vacio').run(req)
    await check('email').isEmail().withMessage('Eso no parece un email').run(req)
    await check('password').isLength({min:6}).withMessage('El password debe ser al menos 6 caracteres').run(req)
    await check('repetir_password').equals(req.body.password).withMessage('Los passwords no son iguales').run(req)

    let resultado = validationResult(req)

    if(!resultado.isEmpty()){
        return res.render('auth/registro', {
            pagina: 'Crear Cuenta',
            csrfToken: req.csrfToken(),
            errores: resultado.array(),
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email,
            }
        })
    }

    //Extraer los datos
    const { nombre, email, password } = req.body

    //Verificar que el usuario no exista
    const existeUsuario = await Usuario.findOne( {where: {email} } )
    if(existeUsuario){
        return res.render('auth/registro', {
            pagina: 'Crear Cuenta',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'El usuario ya esta registrado'}],
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email,
            }
        })
    }

    //Crear el usuario en BD
    const usuario = await Usuario.create({
        nombre,
        email,
        password,
        token: generarId()
    })

    //Enviar email de confirmacion
    emailRegistro({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token
    });

    res.render('templates/mensaje', {
        pagina: 'Cuenta creada correctamente',
        mensaje: 'Hemos enviado un email de confirmación. Presione en el enlace'
    });
}

const confirmar = async (req, res) => {
    const { token } = req.params

    //Verificar el token
    const usuario = await Usuario.findOne({ where: {token}})

    if(!usuario){
        return res.render('auth/confirmar-cuenta', {
            pagina: 'Error al confirmar tu cuenta',
            mensaje: 'Hubo un error al confirmar tu cuenta. Intenta de nuevo',
            error: true
        });
    }

    //Confirmar la cuenta
    usuario.confirmado = true;
    usuario.token = '';
    await usuario.save();

    res.render('templates/mensaje', {
        pagina: 'Cuenta confirmada',
        mensaje: 'La cuenta se confirmó correctamente',
        error: false
    });
}

const formularioOlvidePassword = (req, res) => {

    res.render('auth/olvide-password', {
        pagina: 'Recuperar contraseña',
        csrfToken: req.csrfToken()
    });
}

const resetPassword = async(req, res) => {
//validacion de campos
    await check('email').isEmail().withMessage('Eso no parece un email').run(req)

    let resultado = validationResult(req)

    if(!resultado.isEmpty()){
        return res.render('auth/olvide-password', {
            pagina: 'Recuperar contraseña',
            csrfToken: req.csrfToken(),
            errores: resultado.array(),
        })
    }

    //Extraer los datos
    const { email } = req.body

    //Buscar el usuario
    const usuario = await Usuario.findOne({where: {email}})

    if(!usuario){
        return res.render('auth/olvide-password', {
            pagina: 'Recuperar contraseña',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'Ha habido un error'}],
        })
    }

    //Generar token
    usuario.token = generarId()
    await usuario.save()

    //enviar email con link de recuperacion
    emailOlvidePassword({
        email: usuario.email, 
        nombre: usuario.nombre,
        token: usuario.token
    })

    //Mostrar mensaje
    res.render('templates/mensaje', {
        pagina: 'Reestablece tu password',
        mensaje: 'Hemos enviado un email con las instrucciones',
        error: false
    });

}

const comprobarToken = async(req, res) => {

    const { token } = req.params
    try {
        const usuario = await Usuario.findOne({ where: {token}})

        if(!usuario){
            return res.render('auth/confirmar-cuenta', {
                pagina: 'Reestablece tu password',
                mensaje: 'Hubo un error al validar tu informacion. Intenta de nuevo',
                error: true
            });
        }
        
        //mostrar formulario para resetear password
        res.render('auth/reset-password', {
            pagina: 'Reestablece tu password',
            csrfToken: req.csrfToken()
        })
    } catch (error) {
        console.log(error)
    }
}

const nuevoPassword = async(req, res) => {
    //Validar el password
    await check('password').isLength({min:6}).withMessage('El password debe ser al menos 6 caracteres').run(req)

    let resultado = validationResult(req)

    if(!resultado.isEmpty()){
        return res.render('auth/reset-password', {
            pagina: 'Reestablecer password',
            csrfToken: req.csrfToken(),
            errores: resultado.array(),
        })
    }

    //Identificar quien hace el password
    const { token } = req.params
    const { password } = req.body

    const usuario = await Usuario.findOne({ where: {token}})
    
    //hash nuevo password
    const salt = await bcrypt.genSalt(10)
    usuario.password = await bcrypt.hash(password, salt)
    usuario.token = null
    await usuario.save()

    res.render('auth/confirmar-cuenta', {
        pagina: 'Password Reestablecido',
        mensaje: 'El password se guardo correctamente'
    })
}

export {
    formularioLogin,
    autenticar,
    cerrarSesion,
    formularioRegistro,
    registrar,
    confirmar,
    formularioOlvidePassword,
    resetPassword,
    comprobarToken,
    nuevoPassword
}