/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const users = app.findCollectionByNameOrId("_pb_users_auth_")

  users.fields.add(
    new Field({
      type: "bool",
      name: "password_changed",
    })
  )

  users.updateRule = "id = @request.auth.id"
  users.viewRule = "id = @request.auth.id"

  app.save(users)
}, (app) => {
  const users = app.findCollectionByNameOrId("_pb_users_auth_")

  users.fields.removeByName("password_changed")

  users.updateRule = ""
  users.viewRule = ""

  app.save(users)
})
