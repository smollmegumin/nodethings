const express = require('express')
const path = require('path')

const routes = express.Router()
const controller_compras = require('../controllers/admin/compras')

routes.get('/carrito',controller_compras.getCarrito)
routes.post('/carrito',controller_compras.postCarrito)
routes.post('/carrito/eliminar',controller_compras.postEliminarProducto)
routes.post('/realizarcompra',controller_compras.postRealizarCompra)
routes.get('/pedidos',controller_compras.getPedidos)
routes.get('/pedidos/detalles/:id',controller_compras.getFactura)


exports.routes=routes;


