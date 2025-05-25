export function isLocal() {
    return process.env.NODE_ENV === 'development';
}

export function isDocker() {
    return process.env.NODE_ENV === 'production';
}

export function getBackendUrl() {
    return isLocal() ? 'http://localhost:3000' : 'http://fita-a-fita-backend:3000';
}
