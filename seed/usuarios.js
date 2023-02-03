import bcrypt from 'bcrypt'

const usuarios = [
    {
        nombre: 'Pedro',
        email: 'pedro@gmail.com',
        confirmado: 1,
        password: bcrypt.hashSync('123456', 5)
    },
    {
        nombre: 'Juan',
        email: 'juan@gmail.com',
        confirmado: 1,
        password: bcrypt.hashSync('123456', 5)
    }
]

export default usuarios