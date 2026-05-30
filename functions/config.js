export async function onRequest(context) {

    const downtimeStarted =
        await context.env.STATUS_KV.get(
            "downtimeStarted"
        );

    const expectedBackOnline =
        await context.env.STATUS_KV.get(
            "expectedBackOnline"
        );

    console.log(
        "KV downtimeStarted:",
        downtimeStarted
    );

    console.log(
        "KV expectedBackOnline:",
        expectedBackOnline
    );

    return Response.json({
        downtimeStarted,
        expectedBackOnline
    });
}