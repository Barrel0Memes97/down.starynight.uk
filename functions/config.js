export async function onRequest(context) {

    try {

        const kv = context.env.STATUS_KV;

        if (!kv) {
            return new Response(
                JSON.stringify({ error: "KV missing" }),
                { headers: { "Content-Type": "application/json" } }
            );
        }

        const online = await kv.get("online");

        return new Response(
            JSON.stringify({
                ok: true,
                online
            }),
            { headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {

        return new Response(
            JSON.stringify({
                error: err.message,
                stack: err.stack
            }),
            { headers: { "Content-Type": "application/json" } }
        );
    }
}