import printJS from 'print-js'

export default defineNuxtPlugin(() => {
    return {
        provide: {
            printJS,
        },
    }
})
