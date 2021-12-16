const router = require('express').Router()
const controller = require('./tables.controller')

router
    .route('/:table_id/seat')
    .put(controller.update)
    .delete(controller.removeReservation)

router
    .route('/')
    .get(controller.list)
    .post(controller.create)
    .delete(controller.destroy)

    module.exports = router