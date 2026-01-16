import { defineStore } from 'pinia';

export const useAuth = defineStore('auth', {
    state: () => ({
        user: null,
        token: process.client ? localStorage.getItem('token') : null
    }),

    actions: {
        async login(email: string, password: string) {
            const config = useRuntimeConfig()
            const res = await $fetch('/login', {
                baseURL: config.public.apiBase, method: 'POST', body: { email, password }
            })
            if (res) {
                this.token = res?.token
                this.user = res?.user
                localStorage.setItem('token', res.token)
            }
        },
        logout() {
            this.user = null
            this.token = null
            localStorage.removeItem('token')
        }
    }
})