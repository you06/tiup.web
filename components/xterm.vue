<template>
    <div id="terminal-container" style="width: 100%; height: 100vh;"></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Terminal } from '@xterm/xterm'
// import { FitAddon } from '@xterm/addon-fit'
// import { WebLinksAddon } from '@xterm/addon-web-links'

const KEY_CODES: { [key: number]: string } = {
    13: 'Enter',
    127: 'Backspace',
}

onMounted(async () => {
    const { FitAddon } = await import('@xterm/addon-fit')
    const { WebLinksAddon } = await import('@xterm/addon-web-links')

    const term = new Terminal()
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.loadAddon(new WebLinksAddon())

    const container = document.getElementById('terminal-container')
    term.open(container!)
    fitAddon.fit()

    const sessionResp = await fetch('/api/sql/bootstrap', {
        method: 'POST',
        body: JSON.stringify({
            token: 'test',
        }),
        headers: {
            'Content-Type': 'application/json',
        },
    })
    const session: { id: number, msg: string } = await sessionResp.json()

    console.log('Session created:', session)
    term.write(session.msg)

    let pendingData: string = ''
    let pendingResp: boolean = false

    function execute() {
        if (pendingData.trim() === '') return
        pendingResp = true
        fetch('/api/sql/execute', {
            method: 'POST',
            body: JSON.stringify({
                token: 'test',
                id: session.id,
                input: pendingData,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(async (resp) => {
            const data: { output: string } = await resp.json()
            term.write(data.output)
            pendingData = ''
            pendingResp = false
        }).catch((err) => {
            pendingData = ''
            pendingResp = false
            term.write(`\r\nError: ${err.message}\r\nmysql> `)
        })
    }

    term.onKey((key, _ev) => {
        if (pendingResp) return
        const code = key.key.charCodeAt(0)
        switch (code) {
            case 13: // Enter key
                console.log('Enter key pressed')
                term.write('\r\n')
                console.log(`Pending data: ${pendingData}`)
                execute()
                break
            case 127: // Backspace key
                console.log('Enter key pressed')
                if (pendingData.length === 0) return
                pendingData = pendingData.slice(0, -1)
                term.write('\b \b')
                break
            default:
                if (code in KEY_CODES) {
                    console.log(`unhandled code: code: ${code}, name: ${KEY_CODES[code]}`)
                }
                term.write(key.key)
                pendingData = pendingData.concat(key.key)
        }
    })

    // // // 接收后端输出并显示在终端
    // socket.on('message', event => {
    //     const data = JSON.parse(event.data);
    //     if (data.output) {
    //         term.write(data.output);
    //     }
    // })

    // // // 处理连接关闭
    // socket.on('close', () => {
    //     term.write('\r\nConnection closed\r\n');
    // })
})
</script>


<style lang="scss">
.xterm-helpers {
    height: 0;
    opacity: 0;
}
</style>
