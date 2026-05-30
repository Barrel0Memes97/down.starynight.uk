export async function onRequest(context) {

const kv = context.env.STATUS_KV;

console.log("===== CONFIG REQUEST =====");

/*
 * Current status values
 */
const online =
    await kv.get("online") || "0";

const downtimeStarted =
    await kv.get("downtimeStarted");

const expectedBackOnline =
    await kv.get("expectedBackOnline");

let outageRecorded =
    await kv.get("outageRecorded");

if (!outageRecorded) {
    outageRecorded = "0";
}

console.log("online:", online);
console.log("downtimeStarted:", downtimeStarted);
console.log("expectedBackOnline:", expectedBackOnline);
console.log("outageRecorded:", outageRecorded);

/*
 * If server came back online and we haven't
 * recorded this outage yet, save it.
 */
if (
    online === "1" &&
    outageRecorded === "0" &&
    downtimeStarted
) {

    console.log("Recording outage...");

    const outageEnded =
        new Date().toISOString();

    const durationMs =
        new Date(outageEnded) -
        new Date(downtimeStarted);

    const durationMinutes =
        Math.round(durationMs / 60000);

    const durationHours =
        +(durationMs / 3600000).toFixed(2);

    const outage = {
        started: downtimeStarted,
        ended: outageEnded,
        durationMinutes,
        durationHours
    };

    const outageKey =
        `outage:${Date.now()}`;

    await kv.put(
        outageKey,
        JSON.stringify(outage)
    );

    await kv.put(
        "outageRecorded",
        "1"
    );

    console.log(
        "Outage saved:",
        outageKey
    );
}

/*
 * Gather outage history
 */
const history = [];

let cursor;

do {

    const result =
        await kv.list({
            prefix: "outage:",
            cursor
        });

    cursor = result.cursor;

    for (const key of result.keys) {

        try {

            const value =
                await kv.get(key.name);

            if (value) {

                history.push(
                    JSON.parse(value)
                );

            }

        } catch (err) {

            console.error(
                "Failed loading outage:",
                key.name,
                err
            );

        }

    }

} while (cursor);

/*
 * Newest first
 */
history.sort(
    (a, b) =>
        new Date(b.started) -
        new Date(a.started)
);

/*
 * Statistics
 */
const now = Date.now();

const thirtyDaysAgo =
    now - (30 * 24 * 60 * 60 * 1000);

let totalDowntimeMinutes = 0;
let outagesLast30Days = 0;

for (const outage of history) {

    totalDowntimeMinutes +=
        outage.durationMinutes || 0;

    const started =
        new Date(
            outage.started
        ).getTime();

    if (started >= thirtyDaysAgo) {
        outagesLast30Days++;
    }

}

const totalMinutes30Days =
    30 * 24 * 60;

const uptimePercentage =
    (
        (
            totalMinutes30Days -
            totalDowntimeMinutes
        ) /
        totalMinutes30Days
    ) * 100;

const stats = {

    outageCount:
        history.length,

    outagesLast30Days,

    totalDowntimeMinutes,

    totalDowntimeHours:
        +(totalDowntimeMinutes / 60)
            .toFixed(2),

    uptime30DayPercent:
        Math.max(
            0,
            Math.min(
                100,
                uptimePercentage
            )
        ).toFixed(3)

};


console.log("History entries:",
    history.length);

console.log("Stats:", stats);

return Response.json({

    online:
        online === "1",

    downtimeStarted,

    expectedBackOnline,

    history,

    stats,

    generatedAt:
        new Date().toISOString()

});

}