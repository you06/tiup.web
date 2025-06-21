import child_process from 'child_process'

export async function exec(cmd: string): Promise<string> {
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
