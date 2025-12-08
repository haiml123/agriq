export const TempratureVariables = [
    { key: "{site_name}", description: "Name of the site" },
    { key: "{compound_name}", description: "Name of the compound" },
    { key: "{cell_name}", description: "Name of the cell" },
    { key: "{sensor_name}", description: "Name of the sensor" },
    { key: "{commodity_type}", description: "Type of commodity stored" },
    { key: "{metric}", description: "Metric type (Temperature/Humidity)" },
    { key: "{value}", description: "Current metric value" },
    { key: "{unit}", description: "Unit of measurement (°C or %)" },
    { key: "{threshold}", description: "Threshold value that was exceeded" },
    { key: "{severity}", description: "Alert severity level" },
    { key: "{timestamp}", description: "Time when alert was triggered" },
    { key: "{trigger_name}", description: "Name of this trigger" },
] as const