const knex = require('../db/connection')

function list(reservation_date) {
    return knex('reservations')
        .select('*')
        .where({ reservation_date })
        .whereRaw( "(status is null or ( status <> 'finished' and status <> 'cancelled')) " )
        .orderBy('reservation_time', 'asc');
}

function create(reservation) {
    return knex('reservations')
        .insert(reservation)
        .returning('*')
        .then((createdRecords) => createdRecords[0]);
}

function update(reservation_id, status) {
    return knex('reservations')
        .where({ reservation_id })
        .update('status', status)
        .returning('*')
        .then((createdRecords) => createdRecords[0]);
}

function editReservation(reservation) {
    return knex('reservations')
        .select('*')
        .where({ reservation_id: reservation.reservation_id })
        .update(reservation, '*');
}

function findByDateAndTime(reservation_date, reservation_time) {
    return knex('reservations')
        .select('*')
        .where({ reservation_date })
        .where({ reservation_time })
        .whereNot({ 'status': 'finished' });
}

function read(reservation_id) {
    return knex('reservations')
        .where({ reservation_id })
        .first()
}

function search(mobile_number) {
    return knex('reservations')
        .whereRaw("translate(mobile_number, '() -', '') like ?", `%${mobile_number.replace(/\D/g, '')}%`)
        .orderBy('reservation_date')
}

function destroy(reservation_id) {
    return knex('reservations')
        .where({ reservation_id })
        .del()
}

module.exports = {
    list,
    create,
    update, 
    editReservation,
    findByDateAndTime,
    read,
    search,
    destroy,
}