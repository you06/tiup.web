import { startSession, Session } from '~/server/utils/exec';

const IN_DEV_MODE = process.env.NODE_ENV !== 'production'

export class Users {
    private userSessions: Map<string, UserSession> = new Map()

    public getUserSession(token: string): UserSession {
        if (!this.userSessions.has(token)) {
            this.userSessions.set(token, new UserSession())
        }
        return this.userSessions.get(token)!
    }

}

class UserSession {
    private idAllocator: number = 0
    private connections: Map<number, Session> = new Map()

    public connect(): [number, Session] {
        let session: Session
        if (IN_DEV_MODE) {
            session = this.localConnection()
        } else {
            session = this.localConnection()
        }
        this.idAllocator++
        const id = this.idAllocator
        this.connections.set(id, session)
        return [id, session]
    }

    private localConnection(): Session {
        return startSession('mysql -h 127.0.0.1 -P 4000 -u root -D test --comments')
    }

    public getConnection(id: number): Session | undefined {
        return this.connections.get(id)
    }
}

export const GlobalUserSessions = new Users()

