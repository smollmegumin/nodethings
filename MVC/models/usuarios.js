const bc = require('bcryptjs')

const mongoose = require('mongoose')
const productos = require('./productos').productos

const Schema = mongoose.Schema
const usuariosSchema = new mongoose.Schema({
	usuario: {
		type: String,
		required: true,
		unique: true
	},
	correo: {
		type: String,
		required: true,
		unique: true
	},
	contraseña: {
		type: String,
		required: true,
		trim: true,
		minlength: 8
	},
	carrito: {
		items: {
			type: [
				{
					id: { type: Schema.Types.ObjectId, required: true, ref: 'Producto' },
					qty: { type: Number, required: true }
				}
			]
		},
		caduca: {
			type: Date,
			required: true,
			default: 0
		},
		total: {
			type: Number,
			required: true,
			default: 0
		}
	},
	resetToken: {
		type: String
	}
})

const buscarProducto = async (id) => {
	return await productos.findById(id)
}
usuariosSchema.virtual('traducirCarro').get(async function() {
	let res = await productos.find()
	console.log(res, this.carrito)
	this.carrito.items = [
		...this.carrito.items.filter(
			(item) =>
				!!res.find((i_find) => i_find._id.toString() == item.id.toString())
		)
	]

	if (res.length > 0 && this.carrito.items.length > 0) {
		return [
			...this.carrito.items.map((i) => {
				let { nombre, precio } = res.find(
					(e) => e._id.toString() == i.id.toString()
				)
				return { nombre, precio, qty: i.qty, id: i.id }
			})
		]
	} else {
		return []
	}
})
usuariosSchema.methods.limpiarCarrito = function() {
	this.carrito.items = []
	this.carrito.total = 0
	return this.save()
}
usuariosSchema.methods.eliminarProducto = function(id, resultado) {
	console.log('resultado', resultado, 'id', id)

	let totalProducto = resultado.reduce(
		(suma, i) =>
			i.id.toString() == id.toString() ? suma + +i.precio * +i.qty : 0,
		0
	)
	this.carrito.items = this.carrito.items.filter(
		(i) => i.id.toString() != id.toString()
	)
	this.carrito.total = +this.carrito.total - +totalProducto
	this.carrito.total = (+this.carrito.total).toFixed(2)
	console.log('this.carrito', this.carrito)

	return this.save()
}
usuariosSchema.virtual('obtenerTotal').get(async function() {
	try {
		let res = await productos.find()

		this.carrito.items = [
			...this.carrito.items.filter(
				(item) =>
					!!res.find((i_find) => i_find._id.toString() == item.id.toString())
			)
		]

		if (res.length > 0 && this.carrito.items.length > 0) {
			let productos = [
				...this.carrito.items.map((i) => {
					let { nombre, precio } = res.find(
						(e) => e._id.toString() == i.id.toString()
					)
					return { nombre, precio, qty: i.qty, id: i.id }
				})
			]
			this.carrito.total = productos
				.map(i => i.precio)
				.reduce((sum, b) => sum + +b)
				console.log('Totales',this.carrito.total,productos);							
		}
		else{
			this.carrito.total = 0
		}

		console.log('total',this.carrito.total);
		
		this.save()
		return Promise.resolve(this.carrito.total)
	} catch (err) {
		return Promise.reject(err)
	}
})
usuariosSchema.methods.agregarCarro = async function(id) {
	let producto = await buscarProducto(id)
	console.log(producto)
	let indice = this.carrito.items.findIndex((i) => i.id == id)

	let existente = this.carrito.items[indice]
	if (existente) {
		this.carrito.items[indice].qty = existente.qty + 1

		this.carrito.items = [...this.carrito.items]

		this.carrito.total = +this.carrito.total + +producto.precio
	} else {
		existente = { id: producto.id, qty: 1 }
		this.carrito.items = [...this.carrito.items, existente]

		this.carrito.total = +this.carrito.total + +producto.precio
		this.carrito.total = this.carrito.total.toFixed(2)
	}
	return this.save()
}
usuariosSchema.pre('save', function(next) {
	if (this.isModified('contraseña')) {
		console.log('modificado')

		bc.genSalt(10, (err, salt) => {
			bc.hash(this.contraseña, salt, (err, hash) => {
				if (err) {
					console.log({
						err,
						mensaje: 'Error al encriptar la contraseña'
					})
				} else {
					console.log(hash)
					this.resetToken = this.usuario
					this.contraseña = hash
					next()
				}
			})
		})
	} else {
		console.log(' no modificado')
		next()
	}
})

usuariosSchema.statics.encriptar_password = async function(pass, mail) {
	try {
		bc.genSalt(10, async (err, salt) => {
			bc.hash(pass, salt, async (err, hash) => {
				if (err) {
					console.log({
						err,
						mensaje: 'Error al encriptar la contraseña'
					})
				} else {
					console.log(hash)
					let nuevo = await this.findOneAndUpdate(
						{ correo: mail },
						{ resetToken: '', contraseña: hash }
					)
					return Promise.resolve(nuevo)
				}
			})
		})
	} catch (err) {
		return Promise.reject(err)
	}
}
usuariosSchema.statics.comprobar = async function(usuario, pass) {
	try {
		let resultado = await this.findOne({
			$or: [{ usuario: usuario }, { correo: usuario }]
		})
		if (!!resultado) {
			let comparacion = await bc.compare(pass, resultado.contraseña)

			if (!!comparacion && !!resultado) {
				return Promise.resolve(resultado)
			} else {
				return Promise.reject(new Error('Las contraseñas no coinciden'))
			}
		} else {
			return Promise.reject(new Error('Usuario invalido'))
		}
	} catch (err) {
		return Promise.reject({
			err,
			mensaje: 'Contraseña invalida'
		})
	}
}
const usuarios = mongoose.model('Usuario', usuariosSchema)

module.exports = {
	usuarios
}
