import child_process from 'child_process'
import * as pty from 'node-pty'

export async function oneshot(cmd: string): Promise<string> {
    const promise = new Promise<string>((resolve, reject) => {
        child_process.exec(cmd, (error, stdout: string, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                reject(error);
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                reject(stderr);
                return;
            }
            resolve(stdout);
        });
    });
    return promise;
}

export class Session {
    private process: child_process.ChildProcess
    private command: string
    private iPty: pty.IPty | null = null

    private idleResolver: (() => void) | null = null
    private idlePromise: Promise<number> | null = null
    private idleTimer: NodeJS.Timeout | null = null
    private idleTimeout = 100 // Idle timeout in milliseconds

    constructor(command: string) {
        this.command = command
        this.process = child_process.spawn(this.command, [], {
            shell: true,
            stdio: ['pipe', 'pipe', 'pipe'],
        })
    }

    private prepareIdleResolver() {
        const start = Date.now();
        this.idlePromise = new Promise((resolve) => {
            this.idleResolver = () => {
                resolve(Date.now() - start);
            }
        })
    }

    private resetIdleTimer(duration: number) {
        if (!this.idlePromise || !this.idleResolver) {
            this.prepareIdleResolver();
        }
        const resolver = this.idleResolver!;
        if (this.idleTimer) clearTimeout(this.idleTimer);
        this.idleTimer = setTimeout(() => {
            resolver();
        }, this.idleTimeout);
    }

    public async bootstrap(): Promise<[number, string]> {
        if (this.iPty) {
            return new Promise((resolve) => {
                resolve([0, 'Session already bootstrapped']);
            })
        }
        this.iPty = pty.spawn('bash', [], {
            name: 'xterm-color',
            cols: 80,
            rows: 30,
            cwd: process.env.HOME,
            env: process.env
        })
        return this.exec(this.command)
    }

    public async exec(input: string): Promise<[number, string]> {
        return new Promise(async (resolve, reject) => {
            this.prepareIdleResolver();
            const data: string[] = []
            this.resetIdleTimer(10 * this.idleTimeout); // Start idle timer, the first chunk can be slow.

            this.iPty?.onData((chunk) => {
                data.push(chunk.toString());
                this.resetIdleTimer(this.idleTimeout); // Reset timer on new data.
            })

            console.log(`Executing command: ${input}`);
            this.iPty?.write(input + '\r')
            
            const duration = await this.idlePromise!;
            resolve([duration, data.join('')]);
        })
    }

    public close() {
        this.process.kill();
    }
}

export function startSession(command: string): Session {
    return new Session(command)
}
