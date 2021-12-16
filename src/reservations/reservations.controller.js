const asyncErrorBoundary = require('../errors/asyncErrorBoundary')
const service = require('./reservations.service')

/**
 * List handler for reservation resources
 */

const validateReservation = (req, res, next) => {
  const { data: { first_name, last_name, mobile_number, reservation_date, reservation_time, people, status } = {} } = req.body

  let temp_reservation_time = reservation_time && reservation_time.replace(':', '')
  let re = /[a-zA-Z]/g

  if (!first_name || first_name === '' || first_name.includes(' ')) {
    next({ status: 400, message: 'Invalid first_name'})
  }

  else if (!last_name || last_name === '') {
    next({ status: 400, message: 'Invalid last_name'})
  }

  else if (!mobile_number || mobile_number === '' || mobile_number.length < 7 || mobile_number === '555-555-5555') {
    next({ status: 400, message: 'Invalid mobile_number'})
  }

  else if (!reservation_date || re.test(reservation_date)) {
    next({ status: 400, message: 'reservation_date must be supplied'})
  }

  else if (new Date(reservation_date).getDay() + 1 === 2) {
    next({ status: 400, message: 'closed on Tuesdays, please pick another day'})
  }

  else if (Date.parse(reservation_date) < Date.now()) {
    next({ status: 400, message: 'reservation_date needs to be on a future day'})
  }

  else if (!reservation_time || re.test(temp_reservation_time)) {
    next({ status: 400, message: 'reservation_time not supplied or is invalid'})
  }

  else if (temp_reservation_time < 1030) {
    next({ status: 400, message: 'reservation_time must be during opened hours'})
  }

  else if (temp_reservation_time > 2130) {
    next({ status: 400, message: 'reservation_time cannot be within an hour of close'})
  }

  else if (!people || people < 1) {
    next({ status: 400, message: 'people must be at least one for a reservation'})
  }

  else if (typeof req.body.data.people !== 'number') {
    next({ status: 400, message: 'Number of people needs to be a number'})
  }

  else if (status === 'seated' || status === 'finished') {
    next({ status: 400, message: 'A reservation cannot be created for people who are seated or finished eating'})
  }

  else {
    next()
  }
}

const isTimeTaken = async (req, res, next) => {
  const { data: { reservation_date, reservation_time } = {} } = req.body
  const data = await service.findByDateAndTime(reservation_date, reservation_time)

  if (data) {
    next({ status: 400, message: 'Reservation already booked for this time'})
  }
  next()
}

const updateValidation = (req, res, next) => {
  const reqStatus = req.body.data.status
  const status = res.locals.reservation.status

  if (reqStatus !== 'booked' && reqStatus !== 'seated' && reqStatus !== 'finished' && reqStatus !== 'cancelled') {
    next({ status: 400, message: 'unknown status'})
  }

  if (status === 'finished') {
    next({ status: 400, message: 'Cannot update a reservation that has been finished'})
  }

  next()
}

const reservationExists = async (req, res, next) => {
  const reservationId = req.params.reservation_id
  const reservation = await service.read(reservationId)

  if (reservation) {
    res.locals.reservation = reservation
    next()
  } else {
    next({ status: 404, message: `Reservation ID ${reservationId} not found` })
  }
}

const create = async (req, res) => {
  const data = await service.create(req.body.data)
  res.status(201).json({ data })
}

const list = async (req, res) => {
  const { date, mobile_number } = req.query
  console.log('date: ', date)
  if (date) {
    const data = await service.list(date)
    res.json({ data })
  } else {
    const data = await service.search(mobile_number)
    res.json({ data })
  }
}

const read = async (req, res) => {
  const data = res.locals.reservation
  res.status(200).json({ data })
}

const update = async (req, res) => {
  const reservation_id = req.params.reservation_id
  const status = req.body.data.status

  const updateStatus = await service.update(reservation_id, status)
  res.status(200).json({ data: updateStatus })
}

const editReservation = async (req, res) => {
  const editedReservation = {
    ...req.body.data,
    reservation_id: res.locals.reservation.reservation_id
  }
  const data = await service.editReservation(editedReservation)
  res.status(200).json({ data: data[0]})
}

const destroy = async (req, res) => {
  const { data: { reservation_id } = {} } = req.body
  const data = await service.destroy(reservation_id)
  res.status(204).json({ data })
}

module.exports = {
  list: asyncErrorBoundary(list),
  create: [validateReservation, asyncErrorBoundary(create)],
  read: [asyncErrorBoundary(reservationExists), read],
  update: [asyncErrorBoundary(reservationExists), updateValidation, asyncErrorBoundary(update)],
  destroy,
  editReservation: [asyncErrorBoundary(reservationExists), validateReservation, asyncErrorBoundary(editReservation)],
}








// async function list(req, res) {
//   res.json({
//     data: [],
//   });
// }

// module.exports = {
//   list,
// };
