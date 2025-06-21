<template>
    <div id="terminal-container" style="width: 100%; height: 100vh;"></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Terminal } from '@xterm/xterm'
// import { FitAddon } from '@xterm/addon-fit'
// import { WebLinksAddon } from '@xterm/addon-web-links'

onMounted(async () => {
    const { FitAddon } = await import('@xterm/addon-fit')
    const { WebLinksAddon } = await import('@xterm/addon-web-links')
    const { io } = await import("socket.io-client")

    const socket = io();
    const term = new Terminal()
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.loadAddon(new WebLinksAddon())

    const container = document.getElementById('terminal-container')
    console.log('Container:', container)
    term.open(container!)
    fitAddon.fit()
    // const socket = new WebSocket('ws://127.0.0.1/ws')
    term.write('Hello from component \x1B[1;3;31mxterm.js\x1B[0m $ ')

    // 终端输入转发到后端
    term.onData(data => {
        console.log('Data sent to server:', data);
        socket.send(JSON.stringify({ input: data }));
    });

    term.onKey((key, ev) => {
        const code = key.key.charCodeAt(0)
        switch (code) {
            case 13: // Enter key
                console.log('Enter key pressed');
                term.write('\r\n');
                break;
            case 127: // Backspace key
                console.log('Enter key pressed');
                term.write('\b \b');
                break;
            default:
                term.write(key.key);
        }
    })

    // // 接收后端输出并显示在终端
    socket.on('message', event => {
        const data = JSON.parse(event.data);
        if (data.output) {
            term.write(data.output);
        }
    })

    // // 处理连接关闭
    socket.on('close', () => {
        term.write('\r\nConnection closed\r\n');
    })
})
</script>
