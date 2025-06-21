import { GlobalUserSessions } from "~/server/sql/sessions"

const IN_DEV_MODE = process.env.NODE_ENV !== 'production'
const DEV_TOKEN = 'dev'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    console.log('/api/sql/bootstrap', body)
    const token: string = IN_DEV_MODE ? DEV_TOKEN : body.token
    const userSessions = GlobalUserSessions.getUserSession(token)
    const [id, session] = userSessions.connect()
    const [duration, msg] = await session.bootstrap()
    return {
        id,
        duration,
        msg,
    }
})
