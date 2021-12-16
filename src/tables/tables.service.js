const knex = require('../db/connection')
// const reservationService = require('../reservations/reservations.service')

function list() {
    return knex('tables')
        .select('*')
        .orderBy('table_name', 'asc');
}

function create(table) {
    return knex('tables')
        .insert(table)
        .returning('*')
        .then((createdRecords) => createdRecords[0]);
}

function destroy(table_id) {
    return knex('tables')
        .where({ table_id })
        .del();
}

function read(table_id) {
    return knex('tables')
        .where({ table_id })
        .first();
}

function update(updatedTable) {
    return knex('tables')
        .where({ table_id: updatedTable.table_id })
        .update(updatedTable, '*')
        .returning('*')
        .then((createdRecords) => createdRecords[0])
}

module.exports = {
    list, 
    create,
    destroy,
    read,
    update,
}