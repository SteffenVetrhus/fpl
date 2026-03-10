/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = new Collection({
    name: "transfer_plans",
    type: "base",
    fields: [
      new Field({
        type: "relation",
        name: "user",
        required: true,
        maxSelect: 1,
        collectionId: "_pb_users_auth_",
      }),
      new Field({
        type: "json",
        name: "plan_data",
        required: true,
        maxSize: 102400,
      }),
      new Field({
        type: "number",
        name: "current_gameweek",
        required: true,
        min: 1,
        max: 38,
      }),
    ],
  })

  collection.indexes = [
    "CREATE UNIQUE INDEX idx_transfer_plans_user ON transfer_plans (user)",
  ]

  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("transfer_plans")
  app.delete(collection)
})
