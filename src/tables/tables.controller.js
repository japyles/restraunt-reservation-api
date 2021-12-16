const asyncErrorBoundary = require('../errors/asyncErrorBoundary')
const service = require('./tables.service')
const reservationService = require('../reservations/reservations.service')

const tableExists = async (req, res, next) => {
    const { table_id } = req.params
    console.log('table_id: ', table_id)
    const table = await service.read(table_id)

    if (table) {
        res.locals.table = table
        next()
    } else {
        next({ status: 404, message: `Table ID ${table_id} cannot be found` })
    }
}

const validateTables = (req, res, next) => {
    // const { data: { table_name, capacity }} = req.body
    const { data = {} } = req.body
    const tableName = data.table_name
    const capacity = data.capacity

    if ( !data ) {
        return next({ status: 400, message: 'data is missing'})
    }

    if (!tableName) {
        return next({ status: 400, message: 'table_name is missing'})
    }

    if (!capacity || capacity < 1) {
        return next({ status: 400, message: 'capacity must be at least 1 or more'})
    }

    if (typeof capacity !== 'number') {
        return next({ status: 400, message: 'capacity must be a number'})
    }

    if (tableName.length < 2) {
        return next({ status: 400, message: 'table_name must be longer than a single character'})
    }

    next()
}

const checkForReservation = (req, res, next) => {
    if (!res.locals.table.reservation_id) {
        return next({ status: 400, message: 'not occupied'})
    }
    next()
}

const create = async (req, res) => {
    const data = await service.create(req.body.data)
    res.status(201).json({ data })
}

const list = async (req, res) => {
    const data = await service.list()
    res.json({ data })
}

const destroy = async (req, res) => {
    const {data: { table_id } = {} } = req.body
    const data = await service.destroy(table_id)
    res.status(204).json({ data })
    // await service.destroy(res.locals.table.table_id)
    // res.status(204)
}

const removeReservation = async (req, res, next) => {
    if (!res.locals.table.reservation_id) {
        return next({ status: 400, message: 'not occupied'})
    }

    const table = await {...res.locals.table, reservation_id: null}

    await reservationService.update (
        Number(res.locals.table.reservation_id), 
        'finished'
    )

    const data = await service.update(table)
    res.status(200).json({ data })
}

const isTableAlreadyOccupied = (req, res, next) => {
    if (res.locals.table.reservation_id) {
        return next({ status: 400, message: 'occupied' })
    }
    next()
}

const resExists = async (req, res, next) => {
    const reservationId = req.body.data.reservation_id

    if (!reservationId) {
        next({ status: 400, message: 'reservation_id missing'})
    }

    const reservation = await reservationService.read(reservationId)

    if (reservation) {
        if (reservation.status === 'seated') {
            next({ status: 400, message: 'reservation is already seated'})
        }
        res.locals.seatingreservation = reservation
        next()
    } else {
        next({ status: 404, message: `reservation_id ${reservationId} does not exist`})
    }
}


const capacityCheck = async (req, res, next) => {
    if (res.locals.table.capacity < res.locals.seatingreservation.people) {
        console.log('capacity: ', res.locals.table.capacity, 'people: ', res.locals.seatingreservation.people)
        next({ status: 400, message: 'table capacity insufficient for number of people on reservation'})
    } else {
        next()
    }
}

const validateDataSent = async (req, res, next) => {
    const { data } = req.body

    if (!data || !data.reservation_id) {
        return next({ status: 400, message: 'data and reservation_id do not exist'})
    }
    next()
}

const update = async (req, res) => {
    const updatedTable = await {
        ...res.locals.table, 
        reservation_id: req.body.data.reservation_id
    }

    await reservationService.update(Number(req.body.data.reservation_id), 'seated')
    const updatedData = await service.update(updatedTable)
    res.status(200).json({ data: updatedData })
}

module.exports = {
    list: [asyncErrorBoundary(list)],
    create: [validateTables, asyncErrorBoundary(create)],
    update: [asyncErrorBoundary(tableExists), validateDataSent, asyncErrorBoundary(resExists), capacityCheck, isTableAlreadyOccupied, asyncErrorBoundary(update)],
    destroy,
    removeReservation: [asyncErrorBoundary(tableExists), checkForReservation, asyncErrorBoundary(removeReservation)],
}