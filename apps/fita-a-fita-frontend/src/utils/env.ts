export function isLocal() {
    return process.env.NODE_ENV === 'development';
}
export function isAstroServer() {
    return process.env.ASTRO_SERVER === 'true';
}

export function getBackendUrl() {
    return isLocal() ? 'http://localhost:3000' : 'http://fita-a-fita-backend:3000';
}
