/// <reference path="../pb_data/types.d.ts" />

/**
 * Add FPL-Core-Insights stat fields to gameweek_stats collection.
 *
 * These fields are populated by scraper-fplcore from the
 * FPL-Core-Insights playermatchstats.csv data.
 */
migrate((app) => {
  const collection = app.findCollectionByNameOrId("gameweek_stats")

  const newFields = [
    { name: "chances_created", type: "number", min: 0 },
    { name: "successful_dribbles", type: "number", min: 0 },
    { name: "touches_opposition_box", type: "number", min: 0 },
    { name: "recoveries", type: "number", min: 0 },
    { name: "duels_won", type: "number", min: 0 },
    { name: "aerial_duels_won", type: "number", min: 0 },
    { name: "big_chances_missed", type: "number", min: 0 },
    { name: "goals_prevented", type: "number" },
    { name: "defensive_contributions", type: "number", min: 0 },
  ]

  for (const field of newFields) {
    collection.fields.add(new Field(field))
  }

  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("gameweek_stats")

  const fieldNames = [
    "chances_created",
    "successful_dribbles",
    "touches_opposition_box",
    "recoveries",
    "duels_won",
    "aerial_duels_won",
    "big_chances_missed",
    "goals_prevented",
    "defensive_contributions",
  ]

  for (const name of fieldNames) {
    collection.fields.removeByName(name)
  }

  app.save(collection)
})
