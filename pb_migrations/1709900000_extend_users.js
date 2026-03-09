/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const users = app.findCollectionByNameOrId("_pb_users_auth_")

  users.fields.add(
    new Field({
      type: "number",
      name: "fpl_manager_id",
      required: true,
      min: 1,
    })
  )

  users.fields.add(
    new Field({
      type: "text",
      name: "player_name",
      required: true,
      max: 200,
    })
  )

  users.fields.add(
    new Field({
      type: "text",
      name: "team_name",
      required: false,
      max: 200,
    })
  )

  users.indexes = [
    ...users.indexes,
    "CREATE UNIQUE INDEX idx_users_fpl_manager_id ON users (fpl_manager_id)",
  ]

  app.save(users)
}, (app) => {
  const users = app.findCollectionByNameOrId("_pb_users_auth_")

  users.fields.removeByName("fpl_manager_id")
  users.fields.removeByName("player_name")
  users.fields.removeByName("team_name")

  users.indexes = users.indexes.filter(
    (idx) => !idx.includes("idx_users_fpl_manager_id")
  )

  app.save(users)
})
