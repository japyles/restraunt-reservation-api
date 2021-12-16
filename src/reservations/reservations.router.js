/**
 * Defines the router for reservation resources.
 *
 * @type {Router}
 */

const router = require("express").Router();
const controller = require("./reservations.controller");

router
    .route('/:reservation_id')
    .get(controller.read)
    .put(controller.editReservation)

router
    .route('/:reservation_id/status')
    .put(controller.update)

router
    .route("/")
    .get(controller.list)
    .post(controller.create)

module.exports = router;
