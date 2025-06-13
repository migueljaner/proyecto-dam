import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { getBackendUrl } from '../utils/env';

export const server = {
    login: defineAction({
        input: z.object({
            email: z.string().email(),
            password: z.string().min(8),
        }),
        handler: async (input, context) => {
            try {
                const res = await fetch(getBackendUrl() + '/api/v1/users/login', {
                    method: 'POST',
                    body: JSON.stringify({
                        email: input.email,
                        password: input.password,
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const data = await res.json();

                if (data.status === 'success') {
                    // Get the Set-Cookie header from the response
                    const setCookieHeader = res.headers.get('set-cookie');

                    if (setCookieHeader) {
                        context.cookies.set('jwt', setCookieHeader.split(';')[0].split('=')[1], {
                            path: '/',
                            httpOnly: true,
                            secure: true,
                            sameSite: 'strict',
                        });

                        context.session?.set('user', data.data);
                    }
                    return { success: true, data: data.data, message: data.message };
                }
                return { success: false, data: data.message, message: data.message };
            } catch (error) {
                return { success: false, data: error };
            }
        },
    }),
    updateUserData: defineAction({
        accept: 'form',
        input: z.object({
            name: z.string(),
            email: z.string().email(),
            photo: z.instanceof(File).optional(),
        }),

        handler: async (input, context) => {
            const { name, email, photo } = input;
            try {
                const formData = new FormData();
                formData.append('name', name);
                formData.append('email', email);
                if (photo) {
                    formData.append('photo', photo);
                }

                const res = await fetch(getBackendUrl() + '/api/v1/users/updateMe', {
                    method: 'PATCH',
                    body: formData,
                    headers: {
                        Cookie: `jwt=${context.cookies.get('jwt')?.value || ''}`,
                    },
                });

                const data = await res.json();

                if (data.status === 'success') {
                    context.session?.set('user', data.data.user);
                    return { success: true, data: data.data };
                }
                return { success: false, data: data.message };
            } catch (error) {
                return { success: false, data: error };
            }
        },
    }),
    updatePassword: defineAction({
        input: z.object({
            passwordCurrent: z.string().min(8),
            password: z.string().min(8),
            passwordConfirm: z.string().min(8),
        }),
        handler: async ({ passwordCurrent, password, passwordConfirm }, context) => {
            try {
                const res = await fetch(getBackendUrl() + '/api/v1/users/updateMyPassword', {
                    method: 'PATCH',
                    body: JSON.stringify({
                        passwordCurrent,
                        password,
                        passwordConfirm,
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                        Cookie: 'jwt=' + (context.cookies.get('jwt')?.value || ''),
                    },
                });

                const data = await res.json();
                console.log(data);

                if (data.status === 'success') {
                    context.cookies.delete('jwt', { path: '/' });
                    context.session?.set('user', null);
                    return { success: true, data: data.data };
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
    bookTour: defineAction({
        input: z.object({
            tourId: z.string(),
        }),
        handler: async (input, context) => {
            const { tourId } = input;
            try {
                const res = await fetch(getBackendUrl() + '/api/v1/bookings/checkout-session/' + tourId, {
                    headers: {
                        'Content-Type': 'application/json',
                        Cookie: 'jwt=' + (context.cookies.get('jwt')?.value || ''),
                    },
                });

                const data = await res.json();

                if (data.status === 'success') {
                    return { success: true, data: data.session };
                }
                return { success: false, data: data.message };
            } catch (error) {
                return { success: false, data: error };
            }
        },
    }),
    signup: defineAction({
        input: z.object({
            name: z.string().min(2),
            email: z.string().email(),
            password: z.string().min(8),
            passwordConfirm: z.string().min(8),
            role: z.enum(['user', 'guide']).default('user'),
        }),
        handler: async (input) => {
            try {
                const res = await fetch(getBackendUrl() + '/api/v1/users/signup', {
                    method: 'POST',
                    body: JSON.stringify(input),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const data = await res.json();

                if (data.status === 'success') {
                    return { success: true, message: 'Please check your email to confirm your account' };
                }
                return { success: false, message: data.message };
            } catch (error) {
                return { success: false, message: 'Something went wrong' };
            }
        },
    }),
    forgotPassword: defineAction({
        input: z.object({
            email: z.string().email(),
        }),
        handler: async (input) => {
            try {
                const res = await fetch(getBackendUrl() + '/api/v1/users/forgotPassword', {
                    method: 'POST',
                    body: JSON.stringify({
                        email: input.email,
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const data = await res.json();

                if (data.status === 'success') {
                    return { success: true, message: 'Password reset link sent to your email' };
                }
                return { success: false, message: data.message };
            } catch (error) {
                return { success: false, message: 'Something went wrong' };
            }
        },
    }),
    resetPassword: defineAction({
        input: z.object({
            password: z.string().min(8),
            passwordConfirm: z.string().min(8),
            token: z.string(),
        }),
        handler: async (input) => {
            try {
                const res = await fetch(getBackendUrl() + '/api/v1/users/resetPassword/' + input.token, {
                    method: 'POST',
                    body: JSON.stringify({
                        password: input.password,
                        passwordConfirm: input.passwordConfirm,
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const data = await res.json();

                if (data.status === 'success') {
                    return {
                        success: true,
                        message: 'Password reset successful! Please log in with your new password.',
                    };
                }
                return { success: false, message: data.message };
            } catch (error) {
                return { success: false, message: 'Something went wrong' };
            }
        },
    }),
};
