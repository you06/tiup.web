<template>
    <div id="toolbar">Toolbar Placeholder</div>
    <XTerm />
</template>

<script setup lang="ts">
import XTerm from '~/components/xterm.vue'

// testCreateConn = async () => {
//     const { data } = await $fetch('/api/sql/bootstrap', {
//         method: 'POST',
//         body: {
//             token: 'test',
//         },
//     })
// }

// const { data } = await useFetch('/api/versions')
</script>

<style lang="scss">
#toolbar {
    height: 100px;
    background-color: #333;
    color: #fff;
}
</style>
