const express = require('express')
const path = require('path')

const controller_productos = require('../controllers/admin/productos')



const routes = express.Router()

routes.get('/productos',controller_productos.getMisProductos)
routes.delete('/eliminar/:id',controller_productos.postEliminarProducto)


exports.routes=routes;


