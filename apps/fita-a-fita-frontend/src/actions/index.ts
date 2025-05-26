import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { getBackendUrl } from '../utils/env';

export const server = {
    login: defineAction({
        input: z.object({
            email: z.string().email(),
            password: z.string().min(8),
        }),
        handler: async ({ email, password }, context) => {
            console.log('Email', email);
            console.log('Password', password);
            try {
                const res = await fetch(getBackendUrl() + '/api/v1/users/login', {
                    method: 'POST',
                    body: JSON.stringify({
                        email,
                        password,
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const data = await res.json();

                if (res.ok) {
                    // Get the Set-Cookie header from the response
                    const setCookieHeader = res.headers.get('set-cookie');

                    if (setCookieHeader) {
                        context.cookies.set('jwt', setCookieHeader.split(';')[0].split('=')[1], {
                            path: '/',
                            httpOnly: false,
                            secure: false,
                            sameSite: 'none',
                        });

                        context.session?.set('user', data);
                    }
                    return { success: true, data };
                }
                return { success: false, data };
            } catch (error) {
                return { success: false, data: error };
            }
        },
    }),
    logout: defineAction({
        handler: async (input, context) => {
            console.log('Logout action called');
            context.cookies.delete('jwt', { path: '/' });
            context.session?.set('user', null);
            console.log('Logout action completed');
            return { success: true };
        },
    }),
};
