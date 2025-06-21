import { GlobalUserSessions } from "~/server/sql/sessions"

const IN_DEV_MODE = process.env.NODE_ENV !== 'production'
const DEV_TOKEN = 'dev'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    console.log('/api/sql/mysql', body)
    const token: string = IN_DEV_MODE ? DEV_TOKEN : body.token
    const input = body.input
    if (!input) {
        return {
            error: 'No input provided'
        }
    }
    const userSessions = GlobalUserSessions.getUserSession(token)
    const session = userSessions.getConnection(body.id)
    if (!session) {
        return {
            error: 'Session not found'
        }
    }
    const [duration, output] = await session.exec(input)
    return {
        duration,
        output
     }
})
