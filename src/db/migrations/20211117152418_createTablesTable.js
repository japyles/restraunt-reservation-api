exports.up = function (knex) {
    return knex.schema.createTable("tables", (table) => {
      table.increments('table_id').primary()
      table.integer('reservation_id')
      table.integer('capacity')
      table.string('table_name')
    });
  };
  
  exports.down = function (knex) {
    return knex.schema.dropTable("tables");
  };